import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as webrtcController from '../controllers/webrtcController.js';

const router = express.Router();

// Get ICE servers configuration
router.get('/ice-servers', protect, webrtcController.getIceServers);

// Create a new WebRTC session
router.post('/sessions', protect, webrtcController.createSession);

// Process WebRTC signaling
router.post('/signal', protect, webrtcController.processSignal);

// Get pending signals
router.get('/signals/:sessionId', protect, webrtcController.getPendingSignals);

// Update session status
router.put('/sessions/:sessionId/status', protect, webrtcController.updateSessionStatus);

// Process billing for a session
router.post('/sessions/:sessionId/bill', protect, webrtcController.processBilling);

// End a session
router.put('/sessions/:sessionId/end', protect, webrtcController.endSession);

export default router;