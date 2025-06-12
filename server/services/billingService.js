import Stripe from 'stripe';
import { pool } from '../config/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Process per-minute billing for a session
export const processBilling = async (sessionId) => {
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Get session details
    const sessionResult = await client.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    );
    
    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }
    
    const session = sessionResult.rows[0];
    const { client_id, reader_id, rate } = session;
    
    // Get client balance
    const clientResult = await client.query(
      'SELECT balance FROM profiles WHERE id = $1',
      [client_id]
    );
    
    if (clientResult.rows.length === 0) {
      throw new Error('Client profile not found');
    }
    
    const currentBalance = clientResult.rows[0].balance;
    
    // Check if client has sufficient balance
    if (currentBalance < rate) {
      throw new Error('Insufficient balance');
    }
    
    // Calculate new balance
    const newBalance = currentBalance - rate;
    
    // Update client balance
    await client.query(
      'UPDATE profiles SET balance = $1 WHERE id = $2',
      [newBalance, client_id]
    );
    
    // Calculate reader earnings (70%) and platform fee (30%)
    const readerEarnings = Math.floor(rate * 0.7);
    const platformFee = rate - readerEarnings;
    
    // Update reader earnings
    await client.query(
      'UPDATE profiles SET earnings = earnings + $1 WHERE id = $2',
      [readerEarnings, reader_id]
    );
    
    // Record billing transaction
    const now = new Date();
    await client.query(
      `INSERT INTO billing_events 
       (session_id, event_type, amount_billed, client_balance_before, client_balance_after, 
        reader_earnings, platform_fee, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, 'minute', rate, currentBalance, newBalance, readerEarnings, platformFee, now]
    );
    
    // Update session totals
    await client.query(
      `UPDATE sessions 
       SET total_amount = total_amount + $1, 
           reader_earnings = reader_earnings + $2,
           platform_fee = platform_fee + $3,
           duration_seconds = duration_seconds + 60,
           updated_at = $4
       WHERE id = $5`,
      [rate, readerEarnings, platformFee, now, sessionId]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    return {
      success: true,
      newBalance,
      amountCharged: rate,
      readerEarnings,
      platformFee
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error processing billing:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Add funds to client balance
export const addFunds = async (userId, amount) => {
  try {
    // Create a Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId,
        type: 'balance_add'
      }
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Process successful payment
export const processSuccessfulPayment = async (paymentIntent) => {
  const { userId, type } = paymentIntent.metadata;
  const amount = paymentIntent.amount;
  
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Get current balance
    const result = await client.query(
      'SELECT balance FROM profiles WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User profile not found');
    }
    
    const currentBalance = result.rows[0].balance || 0;
    const newBalance = currentBalance + amount;
    
    // Update balance
    await client.query(
      'UPDATE profiles SET balance = $1 WHERE id = $2',
      [newBalance, userId]
    );
    
    // Record transaction
    await client.query(
      `INSERT INTO transactions 
       (user_id, transaction_type, amount, balance_before, balance_after, 
        payment_intent_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'deposit', amount, currentBalance, newBalance, 
       paymentIntent.id, 'completed', new Date()]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    return { success: true, newBalance };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Process reader payout
export const processReaderPayout = async (readerId) => {
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Get reader profile with Stripe Connect account ID
    const readerResult = await client.query(
      'SELECT * FROM profiles WHERE id = $1 AND role = $2',
      [readerId, 'reader']
    );
    
    if (readerResult.rows.length === 0) {
      throw new Error('Reader profile not found');
    }
    
    const reader = readerResult.rows[0];
    const { stripe_account_id, earnings } = reader;
    
    if (!stripe_account_id) {
      throw new Error('Reader has no Stripe Connect account');
    }
    
    if (earnings < 1500) { // $15.00 minimum payout
      throw new Error('Insufficient earnings for payout');
    }
    
    // Create a transfer to the reader's Stripe account
    const transfer = await stripe.transfers.create({
      amount: earnings,
      currency: 'usd',
      destination: stripe_account_id,
      metadata: {
        readerId,
        type: 'reader_payout'
      }
    });
    
    // Reset reader earnings
    await client.query(
      'UPDATE profiles SET earnings = 0 WHERE id = $1',
      [readerId]
    );
    
    // Record payout
    await client.query(
      `INSERT INTO payouts 
       (reader_id, amount, stripe_transfer_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [readerId, earnings, transfer.id, 'completed', new Date()]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    return { success: true, transferId: transfer.id, amount: earnings };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error processing reader payout:', error);
    throw error;
  } finally {
    client.release();
  }
};