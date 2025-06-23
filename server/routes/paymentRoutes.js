import express from 'express';
import {
  createWalletDepositIntent,
  confirmWalletDeposit,
  createConnectAccount,
  getConnectAccountStatus,
  createPayout,
  getTransactionHistory,
  handleWebhook,
  getPaymentMethods,
  attachPaymentMethod
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { body, query, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Webhook endpoint (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Create wallet deposit payment intent
router.post('/wallet-deposit/intent',
  authMiddleware,
  [
    body('amount').isFloat({ min: 1, max: 500 }).withMessage('Amount must be between $1 and $500')
  ],
  handleValidationErrors,
  createWalletDepositIntent
);

// Confirm wallet deposit
router.post('/wallet-deposit/confirm',
  authMiddleware,
  [
    body('payment_intent_id').isString().notEmpty().withMessage('Payment intent ID is required')
  ],
  handleValidationErrors,
  confirmWalletDeposit
);

// Create Stripe Connect account for readers
router.post('/connect/create',
  authMiddleware,
  [
    body('country').optional().isString().isLength({ min: 2, max: 2 }).withMessage('Country must be a 2-letter country code')
  ],
  handleValidationErrors,
  createConnectAccount
);

// Get Stripe Connect account status
router.get('/connect/status',
  authMiddleware,
  getConnectAccountStatus
);

// Create payout for readers
router.post('/payout',
  authMiddleware,
  [
    body('amount').isFloat({ min: 15 }).withMessage('Minimum payout amount is $15')
  ],
  handleValidationErrors,
  createPayout
);

// Get transaction history
router.get('/transactions',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('type').optional().isIn(['wallet_deposit', 'session_payment', 'payout', 'refund']).withMessage('Invalid transaction type')
  ],
  handleValidationErrors,
  getTransactionHistory
);

// Get payment methods
router.get('/payment-methods',
  authMiddleware,
  getPaymentMethods
);

// Attach payment method to customer
router.post('/payment-methods/attach',
  authMiddleware,
  [
    body('payment_method_id').isString().notEmpty().withMessage('Payment method ID is required')
  ],
  handleValidationErrors,
  attachPaymentMethod
);

export default router;