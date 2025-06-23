import express from 'express';
import {
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
} from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { body, param, query, validationResult } from 'express-validator';
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

// Request a new reading session
router.post('/request',
  authMiddleware,
  [
    body('readerId').isUUID().withMessage('Reader ID must be a valid UUID'),
    body('sessionType').isIn(['chat', 'audio', 'video']).withMessage('Session type must be chat, audio, or video'),
    body('ratePerMinute').isInt({ min: 1 }).withMessage('Rate per minute must be a positive integer')
  ],
  handleValidationErrors,
  requestSession
);

// Respond to session request (for readers)
router.post('/respond',
  authMiddleware,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('response').isIn(['accept', 'reject']).withMessage('Response must be accept or reject')
  ],
  handleValidationErrors,
  respondToSession
);

// Start a reading session
router.post('/start',
  authMiddleware,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  handleValidationErrors,
  startSession
);

// End a reading session
router.post('/end',
  authMiddleware,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  handleValidationErrors,
  endSession
);

// Send message in session
router.post('/message',
  authMiddleware,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
    body('type').optional().isIn(['text', 'image', 'file']).withMessage('Type must be text, image, or file')
  ],
  handleValidationErrors,
  sendMessage
);

// Get session messages
router.get('/:sessionId/messages',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  handleValidationErrors,
  getSessionMessages
);

// Get session history
router.get('/history',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  handleValidationErrors,
  getSessionHistory
);

// Get active sessions
router.get('/active',
  authMiddleware,
  getActiveSessions
);

// Get session details
router.get('/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  handleValidationErrors,
  getSessionDetails
);

// Rate a completed session
router.post('/:sessionId/rate',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().isLength({ max: 500 }).withMessage('Review must be 500 characters or less')
  ],
  handleValidationErrors,
  rateSession
);

// Get available readers
router.get('/readers/available',
  authMiddleware,
  [
    query('specialty').optional().isString().withMessage('Specialty must be a string'),
    query('sortBy').optional().isIn(['rating', 'total_reviews', 'per_minute_rate_chat']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  handleValidationErrors,
  getAvailableReaders
);

export default router;