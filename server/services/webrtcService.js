import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';

// Store active WebRTC sessions
const activeSessions = new Map();

// Process WebRTC signaling
export const processSignal = async (sessionId, fromUserId, toUserId, signal) => {
  try {
    // Store the signal in the database for persistence
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO rtc_signals 
         (session_id, from_user_id, to_user_id, signal_type, signal_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, fromUserId, toUserId, signal.type, JSON.stringify(signal.data), new Date()]
      );
    } finally {
      client.release();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing WebRTC signal:', error);
    throw error;
  }
};

// Create a new WebRTC session
export const createSession = async (readerId, clientId, sessionType, rate) => {
  try {
    const sessionId = uuidv4();
    const client = await pool.connect();
    
    try {
      // Create session record
      const result = await client.query(
        `INSERT INTO sessions 
         (id, reader_id, client_id, session_type, rate, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [sessionId, readerId, clientId, sessionType, rate, 'pending', new Date()]
      );
      
      // Create RTC session record
      await client.query(
        `INSERT INTO rtc_sessions
         (session_id, reader_id, client_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, readerId, clientId, 'pending', new Date()]
      );
      
      return { sessionId: result.rows[0].id };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating WebRTC session:', error);
    throw error;
  }
};

// Get pending signals for a user
export const getPendingSignals = async (userId, sessionId) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM rtc_signals 
         WHERE to_user_id = $1 AND session_id = $2 AND processed = false
         ORDER BY created_at ASC`,
        [userId, sessionId]
      );
      
      // Mark signals as processed
      if (result.rows.length > 0) {
        const signalIds = result.rows.map(row => row.id);
        await client.query(
          `UPDATE rtc_signals SET processed = true WHERE id = ANY($1)`,
          [signalIds]
        );
      }
      
      return result.rows.map(row => ({
        id: row.id,
        fromUserId: row.from_user_id,
        type: row.signal_type,
        data: JSON.parse(row.signal_data),
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting pending signals:', error);
    throw error;
  }
};

// Update session status
export const updateSessionStatus = async (sessionId, status, additionalData = {}) => {
  try {
    const client = await pool.connect();
    try {
      // Update sessions table
      await client.query(
        `UPDATE sessions SET status = $1, updated_at = $2 WHERE id = $3`,
        [status, new Date(), sessionId]
      );
      
      // Update rtc_sessions table
      let queryParams = [status, new Date(), sessionId];
      let updateFields = 'status = $1, updated_at = $2';
      
      // Add additional fields if provided
      if (additionalData.client_sdp) {
        updateFields += ', client_sdp = $4';
        queryParams.push(additionalData.client_sdp);
      }
      
      if (additionalData.reader_sdp) {
        const paramIndex = queryParams.length + 1;
        updateFields += `, reader_sdp = $${paramIndex}`;
        queryParams.push(additionalData.reader_sdp);
      }
      
      await client.query(
        `UPDATE rtc_sessions SET ${updateFields} WHERE session_id = $3`,
        queryParams
      );
      
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
};

// Get ICE servers configuration
export const getIceServers = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  
  // Add TURN server if credentials are available
  if (process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL && process.env.TURN_SERVERS) {
    const turnServers = process.env.TURN_SERVERS.split(',');
    turnServers.forEach(server => {
      iceServers.push({
        urls: server,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL
      });
    });
  }
  
  return { iceServers };
};