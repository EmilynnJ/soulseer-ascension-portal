import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as billingController from '../controllers/billingController.js';

const router = express.Router();

// Add funds to client balance
router.post('/add-funds', protect, billingController.addFunds);

// Process reader payout
router.post('/reader-payout', protect, billingController.processReaderPayout);

// Get payment history
router.get('/history', protect, billingController.getPaymentHistory);

// Get reader earnings
router.get('/earnings', protect, billingController.getReaderEarnings);

// Get client balance
router.get('/balance', protect, billingController.getClientBalance);

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.processWebhook);

export default router;