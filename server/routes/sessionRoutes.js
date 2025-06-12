import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as sessionController from '../controllers/sessionController.js';

const router = express.Router();

// Create a new reading session
router.post('/', protect, sessionController.createSession);

// Get session by ID
router.get('/:id', protect, sessionController.getSessionById);

// Get sessions for current user
router.get('/', protect, sessionController.getUserSessions);

// Update session status
router.put('/:id/status', protect, sessionController.updateSessionStatus);

// End session
router.put('/:id/end', protect, sessionController.endSession);

// Rate session
router.post('/:id/rate', protect, sessionController.rateSession);

export default router;