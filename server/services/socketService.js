// import { enhancedWebRTCService } from './enhancedWebrtcService.js';


// Store connected users and their socket IDs
const connectedUsers = new Map();
const userSockets = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (data) => {
      try {
        const { token, userId } = data;
        
        if (!token || !userId) {
          socket.emit('auth_error', { error: 'Missing authentication data' });
          return;
        }

        // For now, we'll trust the token since Clerk handles auth on frontend
        // In production, you'd verify the Clerk JWT token here

        // Store user connection
        socket.userId = userId;
        connectedUsers.set(userId, {
          socketId: socket.id,
          lastSeen: new Date(),
          isOnline: true
        });
        userSockets.set(socket.id, userId);

        // Join user-specific room
        socket.join(`user_${userId}`);

        // Update user online status in database would go here
        // TODO: Implement with Neon database

        socket.emit('authenticated', { success: true });
        
        // TODO: Notify about active sessions
        // const activeSessions = await getActiveSessions(userId);
        // if (activeSessions.length > 0) {
        //   socket.emit('active_sessions', activeSessions);
        // }

        console.log(`User ${userId} authenticated`);
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('auth_error', { error: 'Authentication failed' });
      }
    });

    // Join session room
    socket.on('join_session_room', (sessionId) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      socket.join(`session_${sessionId}`);
      console.log(`User ${socket.userId} joined session ${sessionId}`);
    });

    // Leave session room
    socket.on('leave_session_room', (sessionId) => {
      socket.leave(`session_${sessionId}`);
      console.log(`User ${socket.userId} left session ${sessionId}`);
    });

    // WebRTC signaling
    socket.on('webrtc_signal', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { sessionId, signal, targetUserId } = data;
        
        if (!sessionId || !signal || !targetUserId) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // TODO: Verify user is part of the session with Neon database
        // For now, we'll allow the signal to pass through

        // Forward signal to target user
        socket.to(`user_${targetUserId}`).emit('webrtc_signal', {
          sessionId,
          fromUserId: socket.userId,
          signal
        });

        console.log(`WebRTC signal forwarded from ${socket.userId} to ${targetUserId}`);
      } catch (error) {
        console.error('WebRTC signaling error:', error);
        socket.emit('error', { message: 'Signaling failed' });
      }
    });

    // Session messages
    socket.on('session_message', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { sessionId, content, type = 'text' } = data;
        
        if (!sessionId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // TODO: Send message through WebRTC service
        // const message = await sendMessage(sessionId, socket.userId, content, type);
        
        // For now, just broadcast to session room
        socket.to(`session_${sessionId}`).emit('session_message', {
          sessionId,
          fromUserId: socket.userId,
          content,
          type,
          timestamp: new Date().toISOString()
        });

        // Message is automatically forwarded to session room by the service
        console.log(`Message sent in session ${sessionId} by ${socket.userId}`);
      } catch (error) {
        console.error('Session message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Reader availability updates
    socket.on('update_availability', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { isAvailable } = data;
        
        // TODO: Update reader availability in Neon database

        // Broadcast availability change to clients looking for readers
        io.emit('reader_availability_changed', {
          readerId: socket.userId,
          isAvailable
        });

        console.log(`Reader ${socket.userId} availability updated: ${isAvailable}`);
      } catch (error) {
        console.error('Availability update error:', error);
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      if (!socket.userId) return;
      
      const { sessionId } = data;
      socket.to(`session_${sessionId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      if (!socket.userId) return;
      
      const { sessionId } = data;
      socket.to(`session_${sessionId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Heartbeat for connection monitoring
    socket.on('heartbeat', () => {
      if (socket.userId) {
        const userData = connectedUsers.get(socket.userId);
        if (userData) {
          userData.lastSeen = new Date();
          connectedUsers.set(socket.userId, userData);
        }
      }
      socket.emit('heartbeat_ack');
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log('User disconnected:', socket.id, 'Reason:', reason);
      
      if (socket.userId) {
        try {
          // TODO: Update user offline status in Neon database

          // Clean up connection tracking
          connectedUsers.delete(socket.userId);
          userSockets.delete(socket.id);

          // TODO: Notify sessions about disconnection
          // const activeSessions = getActiveSessions();
          // for (const [sessionId, sessionData] of activeSessions) {
          //   if (sessionData.client_id === socket.userId || sessionData.reader_id === socket.userId) {
          //     socket.to(`session_${sessionId}`).emit('user_disconnected', {
          //       userId: socket.userId,
          //       sessionId
          //     });
          //   }
          // }

          console.log(`User ${socket.userId} cleaned up`);
        } catch (error) {
          console.error('Disconnect cleanup error:', error);
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = new Date();
    for (const [userId, userData] of connectedUsers) {
      const timeDiff = now - userData.lastSeen;
      if (timeDiff > 5 * 60 * 1000) { // 5 minutes
        console.log(`Cleaning up inactive connection for user ${userId}`);
        connectedUsers.delete(userId);
        
        // TODO: Update database with Neon
        console.log(`User ${userId} marked offline due to inactivity`);
      }
    }
  }, 60000); // Run every minute

  console.log('Socket.IO service initialized');
};

// Helper functions for sending notifications
export const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user_${userId}`).emit('notification', notification);
};

export const sendSessionUpdate = (io, sessionId, update) => {
  io.to(`session_${sessionId}`).emit('session_update', update);
};

export const broadcastReaderAvailability = (io, readerId, isAvailable) => {
  io.emit('reader_availability_changed', {
    readerId,
    isAvailable
  });
};

// Get connected users count
export const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

// Check if user is online
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// Get user's socket ID
export const getUserSocketId = (userId) => {
  const userData = connectedUsers.get(userId);
  return userData ? userData.socketId : null;
};

export default {
  initSocket,
  sendNotificationToUser,
  sendSessionUpdate,
  broadcastReaderAvailability,
  getConnectedUsersCount,
  isUserOnline,
  getUserSocketId
};