import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/errorMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getReaderProfile,
  updateReaderProfile,
  updateReaderAvailability,
  getReaderReviews,
  getAvailableReaders,
  getReaderEarnings,
  uploadReaderDocuments,
  getReaderStats,
  searchReaders
} from '../controllers/readerController.js';
import {
  getReaderSchedule as getReaderScheduleCtrl,
  updateReaderSchedule as updateReaderScheduleCtrl,
  addBlockedDate,
  removeBlockedDate,
  addAvailabilityOverride,
  removeAvailabilityOverride,
  getReaderAvailability
} from '../controllers/readerScheduleController.js';

const router = express.Router();

// Public routes
router.get(
  '/available',
  [
    query('category').optional().isString().trim(),
    query('minRating').optional().isFloat({ min: 1, max: 5 }),
    query('language').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate
  ],
  getAvailableReaders
);

router.get(
  '/search',
  [
    query('query').isString().trim().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate
  ],
  searchReaders
);

router.get(
  '/:id',
  [
    param('id').isUUID(),
    validate
  ],
  getReaderProfile
);

router.get(
  '/:id/reviews',
  [
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate
  ],
  getReaderReviews
);

// Protected routes (require authentication)
router.use(protect);

// Reader-specific routes (only accessible by readers)
router.use(authorize('reader'));

// Reader profile management
router.route('/me/profile')
  .get(getReaderProfile)
  .put(
    [
      body('bio').optional().isString().trim(),
      body('specialties').optional().isArray(),
      body('specialties.*').isString().trim(),
      body('languages').optional().isArray(),
      body('languages.*').isString().trim().isLength({ min: 2, max: 10 }),
      body('experienceYears').optional().isInt({ min: 0, max: 100 }),
      body('responseTime').optional().isString().trim(),
      body('hourlyRate').optional().isFloat({ min: 0 }),
      validate
    ],
    updateReaderProfile
  );

// Reader availability
router.route('/me/availability')
  .get(getReaderSchedule)
  .put(
    [
      body('isAvailable').isBoolean(),
      body('unavailableUntil').optional().isISO8601(),
      validate
    ],
    updateReaderAvailability
  );

// Reader schedule management
router.route('/me/schedule')
  .get(getReaderScheduleCtrl)
  .put(
    [
      body('timeSlots').isArray(),
      body('timeSlots.*.dayOfWeek').isInt({ min: 0, max: 6 }),
      body('timeSlots.*.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('timeSlots.*.endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('timeSlots.*.isAvailable').isBoolean(),
      validate
    ],
    updateReaderScheduleCtrl
  );

// Blocked dates
router.route('/me/blocked-dates')
  .post(
    [
      body('date').isISO8601(),
      body('startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('reason').optional().isString().trim(),
      body('isAllDay').optional().isBoolean(),
      validate
    ],
    addBlockedDate
  );

router.route('/me/blocked-dates/:blockId')
  .delete(removeBlockedDate);

// Availability overrides
router.route('/me/availability-overrides')
  .post(
    [
      body('date').isISO8601(),
      body('startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('isAvailable').isBoolean(),
      body('reason').optional().isString().trim(),
      validate
    ],
    addAvailabilityOverride
  );

router.route('/me/availability-overrides/:overrideId')
  .delete(removeAvailabilityOverride);

// Reader availability check
router.get(
  '/:id/availability',
  [
    param('id').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('timezone').optional().isString().trim(),
    validate
  ],
  getReaderAvailability
);

// Reader documents
router.post(
  '/me/documents',
  [
    // File uploads will be handled by multer middleware
    // Add validation for document type, etc.
  ],
  uploadReaderDocuments
);

// Reader earnings and stats
router.get('/me/earnings', getReaderEarnings);
router.get('/me/stats', getReaderStats);

export default router;
