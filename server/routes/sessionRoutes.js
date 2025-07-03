import express from 'express';
import { requireAuth } from '@clerk/express';
import { neonPool } from '../config/neon.js';
import { body, param, query, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

// Get session details
router.get('/:sessionId', requireAuth(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      const result = await client.query(
        `SELECT rs.*, 
                rp.display_name as reader_name, rp.profile_image as reader_image, 
                rp.bio, rp.specialties, rp.rating_avg, rp.total_reviews,
                cp.display_name as client_name, cp.profile_image as client_image
         FROM reading_sessions rs
         JOIN profiles rp ON rs.reader_id = rp.id
         JOIN profiles cp ON rs.client_id = cp.id
         WHERE rs.id = $1 AND (rp.clerk_id = $2 OR cp.clerk_id = $2)`,
        [sessionId, clerkId]
      );
      
      if (result.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Session not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get session error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get session' });
  }
});

// Get session messages
router.get('/:sessionId/messages', requireAuth(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const client = await neonPool.connect();
    
    try {
      const result = await client.query(
        `SELECT m.*, p.display_name as sender_name
         FROM messages m
         JOIN profiles p ON m.sender_id = p.id
         WHERE m.session_id = $1
         ORDER BY m.created_at ASC`,
        [sessionId]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/:sessionId/messages', requireAuth(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'text' } = req.body;
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      // Get sender profile
      const profileResult = await client.query(
        'SELECT id FROM profiles WHERE clerk_id = $1',
        [clerkId]
      );
      
      if (profileResult.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Profile not found' });
      }
      
      const senderId = profileResult.rows[0].id;
      
      // Insert message
      const result = await client.query(
        `INSERT INTO messages (session_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [sessionId, senderId, content, type]
      );
      
      res.status(StatusCodes.CREATED).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to send message' });
  }
});

// Update billing
router.post('/billing', requireAuth(), async (req, res) => {
  try {
    const { session_id, event_type, duration_seconds, amount_billed, client_balance_before, client_balance_after, metadata } = req.body;
    if (!Number.isInteger(duration_seconds) || duration_seconds <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid duration_seconds' });
    }
    const client = await neonPool.connect();
    
    try {
      await client.query(
        `INSERT INTO billing_transactions (session_id, amount, transaction_type, status, billing_interval_start, billing_interval_end, minutes_billed, metadata)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL $7 * INTERVAL '1 second', NOW(), $5, $6)`,
        [session_id, amount_billed, 'session_payment', 'succeeded', Math.floor(duration_seconds / 60), metadata, duration_seconds]
      );
      
      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Billing update error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update billing' });
  }
});

export default router;