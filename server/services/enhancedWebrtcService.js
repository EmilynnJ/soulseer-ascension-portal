import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '../config/supabase.js';
import Stripe from 'stripe';
import { io } from '../server.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Store active sessions in memory for real-time operations
const activeSessions = new Map();
const billingTimers = new Map();

export class EnhancedWebRTCService {
  constructor() {
    this.activeSessions = activeSessions;
    this.billingTimers = billingTimers;
    this.supabase = getSupabase();
  }

  // Create a new reading session
  async createReadingSession(clientId, readerId, sessionType, ratePerMinute) {
    try {
      // Verify reader is available and get current rates
      const { data: reader, error: readerError } = await this.supabase
        .from('user_profiles')
        .select('is_online, per_minute_rate_chat, per_minute_rate_phone, per_minute_rate_video')
        .eq('id', readerId)
        .single();

      if (readerError || !reader?.is_online) {
        throw new Error('Reader is not available');
      }

      // Validate rate matches reader's current rate
      let currentRate;
      switch (sessionType) {
        case 'chat':
          currentRate = reader.per_minute_rate_chat;
          break;
        case 'audio':
          currentRate = reader.per_minute_rate_phone;
          break;
        case 'video':
          currentRate = reader.per_minute_rate_video;
          break;
        default:
          throw new Error('Invalid session type');
      }

      if (currentRate !== ratePerMinute) {
        throw new Error('Rate mismatch - please refresh and try again');
      }

      // Check client balance
      const { data: client, error: clientError } = await this.supabase
        .from('user_profiles')
        .select('balance')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      const minimumBalance = (ratePerMinute / 100) * 2; // Require at least 2 minutes balance
      if (client.balance < minimumBalance) {
        throw new Error('Insufficient balance for session. Please add funds to your account.');
      }

      const sessionId = uuidv4();

      // Create session record
      const { data: session, error: sessionError } = await this.supabase
        .from('reading_sessions')
        .insert({
          id: sessionId,
          client_id: clientId,
          reader_id: readerId,
          type: sessionType,
          rate_per_minute: ratePerMinute,
          status: 'pending'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Emit real-time notification to reader
      io.to(`user_${readerId}`).emit('session_request', {
        sessionId,
        clientId,
        sessionType,
        ratePerMinute
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  // Accept or reject a session
  async respondToSession(sessionId, readerId, response) {
    try {
      // Verify session belongs to reader
      const { data: session, error: sessionError } = await this.supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('reader_id', readerId)
        .eq('status', 'pending')
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found or not pending');
      }

      const newStatus = response === 'accept' ? 'accepted' : 'rejected';
      
      // Update session status
      const { error: updateError } = await this.supabase
        .from('reading_sessions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Emit real-time notification
      io.to(`user_${session.client_id}`).emit('session_response', {
        sessionId,
        status: newStatus
      });

      return { sessionId, status: newStatus };
    } catch (error) {
      throw error;
    }
  }

  // Start a reading session and begin billing
  async startSession(sessionId, userId) {
    try {
      const { data: session, error: sessionError } = await this.supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .or(`client_id.eq.${userId},reader_id.eq.${userId}`)
        .single();

      if (sessionError || !session || session.status !== 'accepted') {
        throw new Error('Session not found or not ready to start');
      }

      // Update session to in_progress
      const { error: updateError } = await this.supabase
        .from('reading_sessions')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Store session in memory
      this.activeSessions.set(sessionId, {
        ...session,
        startTime: new Date(),
        lastBillingTime: new Date(),
        totalMinutesCharged: 0
      });

      // Start billing timer (charge every minute)
      this.startBillingTimer(sessionId);

      // Emit session started event
      io.to(`session_${sessionId}`).emit('session_started', {
        sessionId,
        startTime: new Date()
      });

      return { sessionId, status: 'started' };
    } catch (error) {
      throw error;
    }
  }

  // Start billing timer for a session
  startBillingTimer(sessionId) {
    const timer = setInterval(async () => {
      try {
        await this.processMinuteBilling(sessionId);
      } catch (error) {
        console.error('Billing error for session', sessionId, error);
        this.endSession(sessionId, 'billing_error');
      }
    }, 60000); // Bill every minute

    this.billingTimers.set(sessionId, timer);
  }

  // Process per-minute billing with Stripe
  async processMinuteBilling(sessionId) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;

    try {
      // Check client balance
      const { data: client, error: clientError } = await this.supabase
        .from('user_profiles')
        .select('balance')
        .eq('id', sessionData.client_id)
        .single();

      if (clientError) throw clientError;

      const ratePerMinute = sessionData.rate_per_minute / 100; // Convert cents to dollars
      
      if (client.balance < ratePerMinute) {
        throw new Error('Insufficient balance');
      }

      // Deduct from client balance
      const { error: clientUpdateError } = await this.supabase
        .from('user_profiles')
        .update({ balance: client.balance - ratePerMinute })
        .eq('id', sessionData.client_id);

      if (clientUpdateError) throw clientUpdateError;

      // Add to reader earnings (70% split)
      const readerEarnings = ratePerMinute * 0.7;
      const platformFee = ratePerMinute * 0.3;

      const { error: readerUpdateError } = await this.supabase
        .from('user_profiles')
        .update({ balance: sessionData.reader_balance + readerEarnings })
        .eq('id', sessionData.reader_id);

      if (readerUpdateError) throw readerUpdateError;

      // Update session data
      sessionData.totalMinutesCharged += 1;
      sessionData.lastBillingTime = new Date();

      // Update session in database
      const { error: sessionUpdateError } = await this.supabase
        .from('reading_sessions')
        .update({
          duration_minutes: sessionData.totalMinutesCharged,
          total_cost: sessionData.totalMinutesCharged * ratePerMinute
        })
        .eq('id', sessionId);

      if (sessionUpdateError) throw sessionUpdateError;

      // Emit billing update
      io.to(`session_${sessionId}`).emit('billing_update', {
        sessionId,
        minutesCharged: sessionData.totalMinutesCharged,
        totalCost: sessionData.totalMinutesCharged * ratePerMinute,
        clientBalance: client.balance - ratePerMinute
      });

    } catch (error) {
      throw error;
    }
  }

  // End a reading session
  async endSession(sessionId, reason = 'completed') {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;

    // Clear billing timer
    const timer = this.billingTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.billingTimers.delete(sessionId);
    }

    try {
      const endTime = new Date();

      // Update session in database
      const { error: updateError } = await this.supabase
        .from('reading_sessions')
        .update({
          status: 'completed',
          end_time: endTime.toISOString(),
          duration_minutes: sessionData.totalMinutesCharged,
          total_cost: sessionData.totalMinutesCharged * (sessionData.rate_per_minute / 100)
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Emit session ended event
      io.to(`session_${sessionId}`).emit('session_ended', {
        sessionId,
        endTime,
        totalMinutes: sessionData.totalMinutesCharged,
        totalCost: sessionData.totalMinutesCharged * (sessionData.rate_per_minute / 100),
        reason
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Process WebRTC signaling
  async processSignal(sessionId, fromUserId, toUserId, signal) {
    try {
      // Forward signal via Socket.IO
      io.to(`user_${toUserId}`).emit('webrtc_signal', {
        sessionId,
        fromUserId,
        signal
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get ICE servers configuration
  getIceServers() {
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // Add TURN servers from environment
    if (process.env.TURN_SERVERS && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
      const turnServers = process.env.TURN_SERVERS.split(',');
      turnServers.forEach(server => {
        iceServers.push({
          urls: `turn:${server}`,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_CREDENTIAL
        });
      });
    }

    return { iceServers };
  }

  // Send chat message during session
  async sendMessage(sessionId, senderId, content, messageType = 'text') {
    try {
      const session = await this.supabase
        .from('reading_sessions')
        .select('client_id, reader_id')
        .eq('id', sessionId)
        .single();

      if (!session.data) {
        throw new Error('Session not found');
      }

      const recipientId = senderId === session.data.client_id 
        ? session.data.reader_id 
        : session.data.client_id;

      // Store message in database
      const messageId = uuidv4();
      const { data: message, error: messageError } = await this.supabase
        .from('messages')
        .insert({
          id: messageId,
          session_id: sessionId,
          sender_id: senderId,
          recipient_id: recipientId,
          content: content,
          message_type: messageType
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Emit real-time message
      io.to(`session_${sessionId}`).emit('new_message', {
        ...message,
        created_at: message.created_at
      });

      return message;
    } catch (error) {
      throw error;
    }
  }

  // Get session history for user
  async getSessionHistory(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('reading_sessions')
        .select(`
          *,
          reader_profile:user_profiles!reading_sessions_reader_id_fkey(
            full_name,
            avatar_url
          ),
          client_profile:user_profiles!reading_sessions_client_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .or(`client_id.eq.${userId},reader_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get active sessions for user
  async getActiveSessions(userId) {
    try {
      const { data, error } = await this.supabase
        .from('reading_sessions')
        .select('*')
        .or(`client_id.eq.${userId},reader_id.eq.${userId}`)
        .in('status', ['pending', 'accepted', 'in_progress']);

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Process Stripe payment for wallet deposit
  async processWalletDeposit(userId, amount, paymentMethodId) {
    try {
      const { data: user, error: userError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/dashboard`,
        metadata: {
          user_id: userId,
          type: 'wallet_deposit'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Update user balance
        const { error: balanceError } = await this.supabase
          .from('user_profiles')
          .update({ balance: user.balance + amount })
          .eq('id', userId);

        if (balanceError) throw balanceError;

        return { success: true, paymentIntent };
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Handle reader payout (daily automatic if balance > $15)
  async processReaderPayout(readerId) {
    try {
      const { data: reader, error: readerError } = await this.supabase
        .from('user_profiles')
        .select('balance')
        .eq('id', readerId)
        .single();

      if (readerError) throw readerError;

      if (reader.balance < 15) {
        return { success: false, message: 'Minimum payout threshold not met' };
      }

      // Create Stripe transfer (requires Stripe Connect setup)
      const transfer = await stripe.transfers.create({
        amount: Math.round(reader.balance * 100),
        currency: 'usd',
        destination: reader.stripe_account_id, // Stored during reader onboarding
        metadata: {
          reader_id: readerId,
          type: 'daily_payout'
        }
      });

      // Update reader balance
      const { error: balanceError } = await this.supabase
        .from('user_profiles')
        .update({ balance: 0 })
        .eq('id', readerId);

      if (balanceError) throw balanceError;

      return { success: true, transfer };
    } catch (error) {
      throw error;
    }
  }

  // Get session messages
  async getSessionMessages(sessionId, userId) {
    try {
      // Verify user is part of session
      const { data: session, error: sessionError } = await this.supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .or(`client_id.eq.${userId},reader_id.eq.${userId}`)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found or access denied');
      }

      const { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select(`
          *,
          sender_profile:user_profiles!messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      return messages;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedWebRTCService = new EnhancedWebRTCService();
