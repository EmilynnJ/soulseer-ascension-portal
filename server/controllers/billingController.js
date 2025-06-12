import * as billingService from '../services/billingService.js';
import { pool } from '../config/db.js';

// Add funds to client balance
export const addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 500) { // Minimum $5.00
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const result = await billingService.addFunds(req.user.id, amount);
    
    res.json(result);
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ message: 'Failed to add funds' });
  }
};

// Process reader payout
export const processReaderPayout = async (req, res) => {
  try {
    // Check if user is a reader
    if (req.user.role !== 'reader') {
      return res.status(403).json({ message: 'Only readers can request payouts' });
    }
    
    const result = await billingService.processReaderPayout(req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ 
      message: 'Failed to process payout',
      error: error.message
    });
  }
};

// Process Stripe webhook
export const processWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = req.app.get('stripe');
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SIGNING_SECRET
    );
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await billingService.processSuccessfulPayment(paymentIntent);
        break;
        
      case 'account.updated':
        // Handle Stripe Connect account updates
        const account = event.data.object;
        // Update reader's account status if needed
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM transactions 
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.user.id]
      );
      
      res.json({ transactions: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ message: 'Failed to get payment history' });
  }
};

// Get reader earnings
export const getReaderEarnings = async (req, res) => {
  try {
    // Check if user is a reader
    if (req.user.role !== 'reader') {
      return res.status(403).json({ message: 'Only readers can access earnings' });
    }
    
    const client = await pool.connect();
    try {
      // Get current earnings
      const earningsResult = await client.query(
        'SELECT earnings FROM profiles WHERE id = $1',
        [req.user.id]
      );
      
      // Get past payouts
      const payoutsResult = await client.query(
        `SELECT * FROM payouts 
         WHERE reader_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [req.user.id]
      );
      
      // Get earnings by day for the last 30 days
      const dailyEarningsResult = await client.query(
        `SELECT 
           DATE_TRUNC('day', created_at) AS day,
           SUM(reader_earnings) AS amount
         FROM billing_events
         WHERE session_id IN (
           SELECT id FROM sessions WHERE reader_id = $1
         )
         AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY day
         ORDER BY day DESC`,
        [req.user.id]
      );
      
      res.json({
        currentEarnings: earningsResult.rows[0]?.earnings || 0,
        payouts: payoutsResult.rows,
        dailyEarnings: dailyEarningsResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting reader earnings:', error);
    res.status(500).json({ message: 'Failed to get earnings' });
  }
};

// Get client balance
export const getClientBalance = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT balance FROM profiles WHERE id = $1',
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      res.json({ balance: result.rows[0].balance || 0 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting client balance:', error);
    res.status(500).json({ message: 'Failed to get balance' });
  }
};