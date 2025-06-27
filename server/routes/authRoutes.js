import express from 'express';
import { requireAuth } from '@clerk/express';
import { neonPool } from '../config/neon.js';
import { body, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

// Sync profile with Clerk user data
router.post('/sync-profile', requireAuth(), async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;
    const client = await neonPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if profile already exists
      const existingProfile = await client.query(
        'SELECT id FROM profiles WHERE clerk_id = $1',
        [clerkId]
      );
      
      if (existingProfile.rows.length === 0) {
        // Create new profile
        await client.query(
          `INSERT INTO profiles (clerk_id, email, display_name, profile_image, role) 
           VALUES ($1, $2, $3, $4, $5)`,
          [clerkId, email, `${firstName || ''} ${lastName || ''}`.trim(), imageUrl, 'client']
        );
      } else {
        // Update existing profile
        await client.query(
          `UPDATE profiles 
           SET email = $2, display_name = $3, profile_image = $4, updated_at = CURRENT_TIMESTAMP
           WHERE clerk_id = $1`,
          [clerkId, email, `${firstName || ''} ${lastName || ''}`.trim(), imageUrl]
        );
      }
      
      await client.query('COMMIT');
      res.status(StatusCodes.OK).json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Profile sync error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to sync profile' });
  }
});

// Get current user profile
router.get('/profile', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM profiles WHERE clerk_id = $1`,
        [clerkId]
      );
      
      if (result.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Profile not found' });
      }
      
      res.status(StatusCodes.OK).json({ profile: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { display_name, bio, specialties, chat_rate, audio_rate, video_rate, is_available } = req.body;
    const client = await neonPool.connect();
    
    try {
      const result = await client.query(
        `UPDATE profiles 
         SET display_name = COALESCE($2, display_name),
             bio = COALESCE($3, bio),
             specialties = COALESCE($4, specialties),
             chat_rate = COALESCE($5, chat_rate),
             audio_rate = COALESCE($6, audio_rate),
             video_rate = COALESCE($7, video_rate),
             is_available = COALESCE($8, is_available),
             updated_at = CURRENT_TIMESTAMP
         WHERE clerk_id = $1
         RETURNING *`,
        [clerkId, display_name, bio, specialties, chat_rate, audio_rate, video_rate, is_available]
      );
      
      if (result.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Profile not found' });
      }
      
      res.status(StatusCodes.OK).json({ profile: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update profile' });
  }
});

export default router;
