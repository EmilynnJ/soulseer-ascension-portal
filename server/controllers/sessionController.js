import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Create a new reading session
export const createSession = async (req, res) => {
  try {
    const { readerId, sessionType, rate } = req.body;
    
    if (!readerId || !sessionType || !rate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const sessionId = uuidv4();
    const client = await pool.connect();
    
    try {
      // Check if reader exists and is available
      const readerResult = await client.query(
        'SELECT * FROM profiles WHERE id = $1 AND role = $2',
        [readerId, 'reader']
      );
      
      if (readerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Reader not found' });
      }
      
      const reader = readerResult.rows[0];
      
      // Check if reader is available
      if (reader.status !== 'online') {
        return res.status(400).json({ message: 'Reader is not available' });
      }
      
      // Check if client has sufficient balance
      const clientResult = await client.query(
        'SELECT balance FROM profiles WHERE id = $1',
        [req.user.id]
      );
      
      if (clientResult.rows.length === 0) {
        return res.status(404).json({ message: 'Client profile not found' });
      }
      
      const clientBalance = clientResult.rows[0].balance || 0;
      
      if (clientBalance < rate) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Create session
      const result = await client.query(
        `INSERT INTO sessions 
         (id, reader_id, client_id, session_type, rate, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [sessionId, readerId, req.user.id, sessionType, rate, 'pending', new Date()]
      );
      
      // Create RTC session record
      await client.query(
        `INSERT INTO rtc_sessions
         (session_id, reader_id, client_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, readerId, req.user.id, 'pending', new Date()]
      );
      
      // Send notification to reader
      // This would typically be done via WebSockets or push notifications
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
};

// Get session by ID
export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT s.*, 
          r.display_name AS reader_name, 
          r.profile_image AS reader_image,
          c.display_name AS client_name,
          c.profile_image AS client_image
         FROM sessions s
         JOIN profiles r ON s.reader_id = r.id
         JOIN profiles c ON s.client_id = c.id
         WHERE s.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const session = result.rows[0];
      
      // Check if user is authorized to access this session
      if (req.user.id !== session.reader_id && req.user.id !== session.client_id) {
        return res.status(403).json({ message: 'Not authorized to access this session' });
      }
      
      res.json(session);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Failed to get session' });
  }
};

// Get sessions for current user
export const getUserSessions = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const client = await pool.connect();
    try {
      let query = `
        SELECT s.*, 
          r.display_name AS reader_name, 
          r.profile_image AS reader_image,
          c.display_name AS client_name,
          c.profile_image AS client_image
        FROM sessions s
        JOIN profiles r ON s.reader_id = r.id
        JOIN profiles c ON s.client_id = c.id
        WHERE (s.reader_id = $1 OR s.client_id = $1)
      `;
      
      const queryParams = [req.user.id];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND s.status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }
      
      query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      const result = await client.query(query, queryParams);
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*) FROM sessions
        WHERE (reader_id = $1 OR client_id = $1)
      `;
      
      if (status) {
        countQuery += ` AND status = $2`;
      }
      
      const countResult = await client.query(
        countQuery,
        status ? [req.user.id, status] : [req.user.id]
      );
      
      res.json({
        sessions: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ message: 'Failed to get sessions' });
  }
};

// Update session status
export const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Missing status' });
    }
    
    const client = await pool.connect();
    try {
      // Check if session exists
      const sessionResult = await client.query(
        'SELECT * FROM sessions WHERE id = $1',
        [id]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const session = sessionResult.rows[0];
      
      // Check if user is authorized to update this session
      if (req.user.id !== session.reader_id && req.user.id !== session.client_id) {
        return res.status(403).json({ message: 'Not authorized to update this session' });
      }
      
      // Update session status
      const result = await client.query(
        `UPDATE sessions 
         SET status = $1, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [status, new Date(), id]
      );
      
      // Update RTC session status
      await client.query(
        `UPDATE rtc_sessions 
         SET status = $1, updated_at = $2
         WHERE session_id = $3`,
        [status, new Date(), id]
      );
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: 'Failed to update session status' });
  }
};

// End session
export const endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, totalAmount } = req.body;
    
    const client = await pool.connect();
    try {
      // Check if session exists
      const sessionResult = await client.query(
        'SELECT * FROM sessions WHERE id = $1',
        [id]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const session = sessionResult.rows[0];
      
      // Check if user is authorized to end this session
      if (req.user.id !== session.reader_id && req.user.id !== session.client_id) {
        return res.status(403).json({ message: 'Not authorized to end this session' });
      }
      
      // Update session
      const result = await client.query(
        `UPDATE sessions 
         SET status = $1, end_time = $2, duration_seconds = $3, total_amount = $4, updated_at = $5
         WHERE id = $6
         RETURNING *`,
        ['completed', new Date(), duration || 0, totalAmount || 0, new Date(), id]
      );
      
      // Update RTC session
      await client.query(
        `UPDATE rtc_sessions 
         SET status = $1, ended_at = $2
         WHERE session_id = $3`,
        ['completed', new Date(), id]
      );
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
};

// Rate session
export const rateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating' });
    }
    
    const client = await pool.connect();
    try {
      // Check if session exists
      const sessionResult = await client.query(
        'SELECT * FROM sessions WHERE id = $1',
        [id]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const session = sessionResult.rows[0];
      
      // Check if user is the client of this session
      if (req.user.id !== session.client_id) {
        return res.status(403).json({ message: 'Only clients can rate sessions' });
      }
      
      // Check if session is completed
      if (session.status !== 'completed') {
        return res.status(400).json({ message: 'Can only rate completed sessions' });
      }
      
      // Add rating
      const result = await client.query(
        `INSERT INTO session_ratings
         (session_id, client_id, reader_id, rating, review, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, session.client_id, session.reader_id, rating, review || null, new Date()]
      );
      
      // Update reader's average rating
      await client.query(
        `UPDATE profiles
         SET rating_avg = (
           SELECT AVG(rating) FROM session_ratings
           WHERE reader_id = $1
         ),
         rating_count = (
           SELECT COUNT(*) FROM session_ratings
           WHERE reader_id = $1
         )
         WHERE id = $1`,
        [session.reader_id]
      );
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error rating session:', error);
    res.status(500).json({ message: 'Failed to rate session' });
  }
};