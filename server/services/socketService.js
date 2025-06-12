import express from 'express';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Store active sessions
const activeSessions = new Map();

// Initialize Socket.IO
export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a reading room
    socket.on('join-room', async ({ sessionId, userId, role }) => {
      try {
        // Join the room
        socket.join(sessionId);
        
        // Store session info
        if (!activeSessions.has(sessionId)) {
          // Get session details from database
          const client = await pool.connect();
          try {
            const result = await client.query(
              'SELECT * FROM sessions WHERE id = $1',
              [sessionId]
            );
            
            if (result.rows.length === 0) {
              socket.emit('error', { message: 'Session not found' });
              return;
            }
            
            const session = result.rows[0];
            
            activeSessions.set(sessionId, {
              id: sessionId,
              readerId: session.reader_id,
              clientId: session.client_id,
              rate: session.rate,
              startTime: null,
              status: 'waiting',
              participants: new Set(),
              billingInterval: null,
            });
          } finally {
            client.release();
          }
        }
        
        // Add participant to session
        const session = activeSessions.get(sessionId);
        session.participants.add(userId);
        
        // Notify room that user joined
        socket.to(sessionId).emit('user-joined', { userId, role });
        
        // If both participants are present, session is ready
        if (session.participants.size === 2) {
          io.to(sessionId).emit('session-ready', { sessionId });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC signaling
    socket.on('signal', ({ sessionId, signal, to }) => {
      socket.to(sessionId).emit('signal', {
        from: socket.id,
        signal,
      });
    });

    // Start session and billing
    socket.on('start-session', async ({ sessionId }) => {
      try {
        const session = activeSessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }
        
        // Update session status
        session.status = 'active';
        session.startTime = new Date();
        
        // Update database
        const client = await pool.connect();
        try {
          await client.query(
            'UPDATE sessions SET status = $1, start_time = $2 WHERE id = $3',
            ['active', session.startTime, sessionId]
          );
        } finally {
          client.release();
        }
        
        // Notify participants
        io.to(sessionId).emit('session-started', {
          sessionId,
          startTime: session.startTime,
        });
        
        // Start billing timer (every minute)
        session.billingInterval = setInterval(async () => {
          try {
            await processBilling(sessionId);
          } catch (error) {
            console.error('Billing error:', error);
            clearInterval(session.billingInterval);
            io.to(sessionId).emit('billing-error', {
              message: 'Billing failed. Session will end.',
            });
            endSession(sessionId, io);
          }
        }, 60000); // Bill every minute
      } catch (error) {
        console.error('Error starting session:', error);
        socket.emit('error', { message: 'Failed to start session' });
      }
    });

    // End session
    socket.on('end-session', ({ sessionId }) => {
      endSession(sessionId, io);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Find and end any active sessions for this socket
      for (const [sessionId, session] of activeSessions.entries()) {
        if (session.participants.has(socket.id)) {
          session.participants.delete(socket.id);
          
          // If session was active, end it
          if (session.status === 'active') {
            endSession(sessionId, io);
          }
          
          // If no participants left, remove session
          if (session.participants.size === 0) {
            activeSessions.delete(sessionId);
          }
        }
      }
    });
  });
};

// Process billing for a session
async function processBilling(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session || session.status !== 'active') return;
  
  const client = await pool.connect();
  try {
    // Get current client balance
    const balanceResult = await client.query(
      'SELECT balance FROM profiles WHERE id = $1',
      [session.clientId]
    );
    
    if (balanceResult.rows.length === 0) {
      throw new Error('Client profile not found');
    }
    
    const currentBalance = balanceResult.rows[0].balance;
    const amountToCharge = session.rate; // Rate is per minute
    
    // Check if client has sufficient balance
    if (currentBalance < amountToCharge) {
      throw new Error('Insufficient balance');
    }
    
    // Update client balance
    const newBalance = currentBalance - amountToCharge;
    await client.query(
      'UPDATE profiles SET balance = $1 WHERE id = $2',
      [newBalance, session.clientId]
    );
    
    // Record billing transaction
    const now = new Date();
    await client.query(
      `INSERT INTO billing_events 
       (session_id, event_type, amount_billed, client_balance_before, client_balance_after, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, 'minute', amountToCharge, currentBalance, newBalance, now]
    );
    
    // Calculate reader earnings (70%)
    const readerEarnings = Math.floor(amountToCharge * 0.7);
    const platformFee = amountToCharge - readerEarnings;
    
    // Update session totals
    await client.query(
      `UPDATE sessions 
       SET total_amount = total_amount + $1, 
           reader_earnings = reader_earnings + $2,
           platform_fee = platform_fee + $3,
           duration_seconds = duration_seconds + 60
       WHERE id = $4`,
      [amountToCharge, readerEarnings, platformFee, sessionId]
    );
    
    // Notify clients of balance update
    return {
      newBalance,
      amountCharged: amountToCharge,
      minutesBilled: 1
    };
  } finally {
    client.release();
  }
}

// End a session
async function endSession(sessionId, io) {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  
  // Clear billing interval
  if (session.billingInterval) {
    clearInterval(session.billingInterval);
    session.billingInterval = null;
  }
  
  // Calculate final duration
  let durationSeconds = 0;
  if (session.startTime) {
    const endTime = new Date();
    durationSeconds = Math.floor((endTime - session.startTime) / 1000);
  }
  
  // Update session status in database
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE sessions SET status = $1, end_time = $2, duration_seconds = $3 WHERE id = $4',
      ['completed', new Date(), durationSeconds, sessionId]
    );
  } catch (error) {
    console.error('Error updating session status:', error);
  } finally {
    client.release();
  }
  
  // Notify participants
  io.to(sessionId).emit('session-ended', {
    sessionId,
    duration: durationSeconds,
  });
  
  // Remove session from active sessions
  activeSessions.delete(sessionId);
}