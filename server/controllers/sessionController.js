import { enhancedWebRTCService } from '../services/enhancedWebrtcService.js';
import { getSupabase } from '../config/supabase.js';
import { StatusCodes } from 'http-status-codes';

const supabase = getSupabase();

// Request a new reading session
export const requestSession = async (req, res) => {
  try {
    const { readerId, sessionType, ratePerMinute } = req.body;
    const clientId = req.user.id;

    // Validate input
    if (!readerId || !sessionType || !ratePerMinute) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing required fields: readerId, sessionType, ratePerMinute'
      });
    }

    // Validate session type
    if (!['chat', 'audio', 'video'].includes(sessionType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Invalid session type. Must be chat, audio, or video'
      });
    }

    // Validate rate is positive
    if (ratePerMinute <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Rate per minute must be positive'
      });
    }

    // Check if client has any pending sessions
    const { data: pendingSessions } = await supabase
      .from('reading_sessions')
      .select('id')
      .eq('client_id', clientId)
      .in('status', ['pending', 'accepted', 'in_progress']);

    if (pendingSessions && pendingSessions.length > 0) {
      return res.status(StatusCodes.CONFLICT).json({
        error: 'You already have an active or pending session'
      });
    }

    const session = await enhancedWebRTCService.createReadingSession(
      clientId,
      readerId,
      sessionType,
      ratePerMinute
    );

    res.status(StatusCodes.CREATED).json(session);
  } catch (error) {
    console.error('Error requesting session:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to request session'
    });
  }
};

// Respond to session request (accept/reject)
export const respondToSession = async (req, res) => {
  try {
    const { sessionId, response } = req.body;
    const readerId = req.user.id;

    // Validate input
    if (!sessionId || !response) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing required fields: sessionId, response'
      });
    }

    if (!['accept', 'reject'].includes(response)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Response must be either "accept" or "reject"'
      });
    }

    const result = await enhancedWebRTCService.respondToSession(
      sessionId,
      readerId,
      response
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error('Error responding to session:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to respond to session'
    });
  }
};

// Start a reading session
export const startSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Session ID is required'
      });
    }

    const result = await enhancedWebRTCService.startSession(sessionId, userId);

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to start session'
    });
  }
};

// End a reading session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Session ID is required'
      });
    }

    // Verify user is part of the session
    const { data: session } = await supabase
      .from('reading_sessions')
      .select('client_id, reader_id, status')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'Session not found'
      });
    }

    if (session.client_id !== userId && session.reader_id !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'You are not authorized to end this session'
      });
    }

    const result = await enhancedWebRTCService.endSession(sessionId, 'manual');

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to end session'
    });
  }
};

// Send message in session
export const sendMessage = async (req, res) => {
  try {
    const { sessionId, content, type = 'text' } = req.body;
    const senderId = req.user.id;

    if (!sessionId || !content) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Session ID and content are required'
      });
    }

    const message = await enhancedWebRTCService.sendMessage(
      sessionId,
      senderId,
      content,
      type
    );

    res.status(StatusCodes.CREATED).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to send message'
    });
  }
};

// Get session messages
export const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Session ID is required'
      });
    }

    const messages = await enhancedWebRTCService.getSessionMessages(sessionId, userId);

    res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    console.error('Error getting session messages:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to get session messages'
    });
  }
};

// Get session history
export const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const sessions = await enhancedWebRTCService.getSessionHistory(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(StatusCodes.OK).json(sessions);
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to get session history'
    });
  }
};

// Get active sessions for user
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await enhancedWebRTCService.getActiveSessions(userId);

    res.status(StatusCodes.OK).json(sessions);
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to get active sessions'
    });
  }
};

// Get session details
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Session ID is required'
      });
    }

    const { data: session, error } = await supabase
      .from('reading_sessions')
      .select(`
        *,
        reader_profile:user_profiles!reading_sessions_reader_id_fkey(
          id,
          full_name,
          avatar_url,
          bio,
          specialties,
          rating,
          total_reviews
        ),
        client_profile:user_profiles!reading_sessions_client_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of the session
    if (session.client_id !== userId && session.reader_id !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'You are not authorized to view this session'
      });
    }

    res.status(StatusCodes.OK).json(session);
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to get session details'
    });
  }
};

// Rate a completed session
export const rateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Session ID is required'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('reading_sessions')
      .select('client_id, reader_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'Session not found'
      });
    }

    if (session.status !== 'completed') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Can only rate completed sessions'
      });
    }

    // Determine which rating field to update
    let updateField;
    let targetUserId;

    if (session.client_id === userId) {
      updateField = 'client_rating';
      targetUserId = session.reader_id;
    } else if (session.reader_id === userId) {
      updateField = 'reader_rating';
      targetUserId = session.client_id;
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'You are not authorized to rate this session'
      });
    }

    // Update session rating
    const { error: updateError } = await supabase
      .from('reading_sessions')
      .update({
        [updateField]: rating,
        [`${updateField.split('_')[0]}_review`]: review
      })
      .eq('id', sessionId);

    if (updateError) {
      throw updateError;
    }

    // Update overall reader rating if this is a client rating
    if (updateField === 'client_rating') {
      // Calculate new average rating for the reader
      const { data: readerSessions } = await supabase
        .from('reading_sessions')
        .select('client_rating')
        .eq('reader_id', targetUserId)
        .eq('status', 'completed')
        .not('client_rating', 'is', null);

      if (readerSessions && readerSessions.length > 0) {
        const totalRating = readerSessions.reduce((sum, s) => sum + s.client_rating, 0);
        const averageRating = totalRating / readerSessions.length;

        await supabase
          .from('user_profiles')
          .update({
            rating: averageRating,
            total_reviews: readerSessions.length
          })
          .eq('id', targetUserId);
      }
    }

    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    console.error('Error rating session:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to rate session'
    });
  }
};

// Get available readers
export const getAvailableReaders = async (req, res) => {
  try {
    const { specialty, sortBy = 'rating', order = 'desc', limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        bio,
        specialties,
        rating,
        total_reviews,
        per_minute_rate_chat,
        per_minute_rate_phone,
        per_minute_rate_video,
        is_online
      `)
      .eq('is_online', true);

    // Filter by specialty if provided
    if (specialty) {
      query = query.contains('specialties', [specialty]);
    }

    // Apply sorting
    const validSortFields = ['rating', 'total_reviews', 'per_minute_rate_chat'];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: order === 'asc' });
    }

    // Apply pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: readers, error } = await query;

    if (error) {
      throw error;
    }

    res.status(StatusCodes.OK).json(readers || []);
  } catch (error) {
    console.error('Error getting available readers:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to get available readers'
    });
  }
};

export default {
  requestSession,
  respondToSession,
  startSession,
  endSession,
  sendMessage,
  getSessionMessages,
  getSessionHistory,
  getActiveSessions,
  getSessionDetails,
  rateSession,
  getAvailableReaders
};