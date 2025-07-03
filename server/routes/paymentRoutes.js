import express from 'express';
import { requireAuth } from '@clerk/express';
import { neonPool } from '../config/neon.js';
import { body, query, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Create Stripe Checkout session for adding funds
router.post('/create-checkout', requireAuth(), async (req, res) => {
  try {
    const { amount } = req.body; // Amount in cents
    const clerkId = req.auth.userId;
    
    if (!amount || amount < 100) { // Minimum $1.00
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid amount' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SoulSeer Wallet Credit',
              description: 'Add funds to your SoulSeer wallet',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancelled`,
      metadata: {
        clerk_id: clerkId,
        type: 'wallet_deposit'
      }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SIGNING_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.metadata?.type === 'wallet_deposit') {
          await handleWalletDeposit(session);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful wallet deposit
async function handleWalletDeposit(session) {
  const client = await neonPool.connect();
  try {
    const clerkId = session.metadata.clerk_id;
    const amount = session.amount_total; // Amount in cents
    
    // Get user profile
    const profileResult = await client.query(
      'SELECT id, balance FROM profiles WHERE clerk_id = $1',
      [clerkId]
    );
    
    if (profileResult.rows.length === 0) {
      throw new Error('Profile not found');
    }
    
    const profile = profileResult.rows[0];
    const newBalance = (profile.balance || 0) + (amount / 100); // Convert to dollars
    
    // Update balance
    await client.query(
      'UPDATE profiles SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newBalance, profile.id]
    );
    
    // Record transaction
    await client.query(
      `INSERT INTO billing_transactions (user_id, amount, currency, transaction_type, status, stripe_payment_intent_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [profile.id, amount, 'USD', 'wallet_deposit', 'succeeded', session.payment_intent, 'Wallet deposit via Stripe']
    );
    
    console.log(`Wallet deposit completed for user ${clerkId}: $${amount / 100}`);
  } finally {
    client.release();
  }
}

// Get payment history
router.get('/history', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      // Get user profile
      const profileResult = await client.query(
        'SELECT id FROM profiles WHERE clerk_id = $1',
        [clerkId]
      );
      
      if (profileResult.rows.length === 0) {
        return res.json([]);
      }
      
      const profile = profileResult.rows[0];
      
      // Get transaction history
      const transactionsResult = await client.query(
        `SELECT * FROM billing_transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [profile.id]
      );
      
      res.json(transactionsResult.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get payment history' });
  }
});

export default router;