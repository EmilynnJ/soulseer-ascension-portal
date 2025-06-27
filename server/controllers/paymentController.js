import Stripe from 'stripe';
import { StatusCodes } from 'http-status-codes';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for wallet deposit
export const createWalletDepositIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Amount must be at least $1.00'
      });
    }

    if (amount > 500) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Maximum deposit amount is $500.00'
      });
    }

    // Get or create Stripe customer
      .from('user_profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      
      const customer = await stripe.customers.create({
        email: user.user.email,
        name: profile?.full_name,
        metadata: {
          user_id: userId
        }
      });

      customerId = customer.id;

      // Update profile with Stripe customer ID
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        user_id: userId,
        type: 'wallet_deposit'
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.status(StatusCodes.OK).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to create payment intent'
    });
  }
};

// Confirm wallet deposit
export const confirmWalletDeposit = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;
    const userId = req.user.id;

    if (!payment_intent_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!paymentIntent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'Payment intent not found'
      });
    }

    if (paymentIntent.metadata.user_id !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'Unauthorized'
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Payment not completed'
      });
    }

    // Check if already processed
      .from('transactions')
      .select('id')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .single();

    if (existingTransaction) {
      return res.status(StatusCodes.CONFLICT).json({
        error: 'Payment already processed'
      });
    }

    const amount = paymentIntent.amount / 100; // Convert from cents

    // Update user balance
      .from('user_profiles')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const newBalance = (profile?.balance || 0) + amount;

      .from('user_profiles')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Create transaction record
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'wallet_deposit',
        status: 'completed',
        stripe_payment_intent_id: payment_intent_id,
        description: `Wallet deposit of $${amount.toFixed(2)}`
      });

    if (transactionError) throw transactionError;

    res.status(StatusCodes.OK).json({
      success: true,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Error confirming wallet deposit:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to confirm deposit'
    });
  }
};

// Create Stripe Connect account for readers
export const createConnectAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { country = 'US' } = req.body;

    // Check if user is a reader
      .from('user_profiles')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single();

    if (profile?.stripe_account_id) {
      return res.status(StatusCodes.CONFLICT).json({
        error: 'Stripe account already exists'
      });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      metadata: {
        user_id: userId
      }
    });

    // Update profile with Stripe account ID
      .from('user_profiles')
      .update({ stripe_account_id: account.id })
      .eq('user_id', userId);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard/reader/stripe-refresh`,
      return_url: `${process.env.FRONTEND_URL}/dashboard/reader/stripe-return`,
      type: 'account_onboarding'
    });

    res.status(StatusCodes.CREATED).json({
      account_id: account.id,
      onboarding_url: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to create Stripe account'
    });
  }
};

// Get Stripe Connect account status
export const getConnectAccountStatus = async (req, res) => {
  try {
    const userId = req.user.id;

      .from('user_profiles')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_account_id) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'Stripe account not found'
      });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    res.status(StatusCodes.OK).json({
      account_id: account.id,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements
    });
  } catch (error) {
    console.error('Error getting Connect account status:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to get account status'
    });
  }
};

// Create payout for reader
export const createPayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount < 15) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Minimum payout amount is $15.00'
      });
    }

      .from('user_profiles')
      .select('balance, stripe_account_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_account_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Stripe account not set up'
      });
    }

    if (profile.balance < amount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Insufficient balance'
      });
    }

    // Create transfer to reader's Stripe account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: profile.stripe_account_id,
      metadata: {
        user_id: userId,
        type: 'reader_payout'
      }
    });

    // Update reader balance
    const newBalance = profile.balance - amount;
      .from('user_profiles')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    // Create transaction record
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'payout',
        status: 'completed',
        stripe_transfer_id: transfer.id,
        description: `Payout of $${amount.toFixed(2)}`
      });

    res.status(StatusCodes.OK).json({
      success: true,
      transfer_id: transfer.id,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to create payout'
    });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type } = req.query;

      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    res.status(StatusCodes.OK).json(transactions || []);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to get transaction history'
    });
  }
};

// Webhook handler for Stripe events
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SIGNING_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(StatusCodes.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(StatusCodes.OK).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Webhook handler failed' });
  }
};

// Helper functions for webhook events
const handlePaymentSucceeded = async (paymentIntent) => {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional processing if needed
};

const handlePaymentFailed = async (paymentIntent) => {
  console.log('Payment failed:', paymentIntent.id);
  // Handle failed payment
};

const handleAccountUpdated = async (account) => {
  // Update reader account status in database
    .from('user_profiles')
    .update({
      stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled
    })
    .eq('stripe_account_id', account.id);
};

const handleTransferCreated = async (transfer) => {
  console.log('Transfer created:', transfer.id);
  // Additional processing if needed
};

// Get payment methods for user
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(StatusCodes.OK).json([]);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card'
    });

    res.status(StatusCodes.OK).json(paymentMethods.data);
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to get payment methods'
    });
  }
};

// Attach payment method to customer
export const attachPaymentMethod = async (req, res) => {
  try {
    const { payment_method_id } = req.body;
    const userId = req.user.id;

    if (!payment_method_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Payment method ID is required'
      });
    }

      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Customer not found'
      });
    }

    await stripe.paymentMethods.attach(payment_method_id, {
      customer: profile.stripe_customer_id
    });

    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to attach payment method'
    });
  }
};

export default {
  createWalletDepositIntent,
  confirmWalletDeposit,
  createConnectAccount,
  getConnectAccountStatus,
  createPayout,
  getTransactionHistory,
  handleWebhook,
  getPaymentMethods,
  attachPaymentMethod
};