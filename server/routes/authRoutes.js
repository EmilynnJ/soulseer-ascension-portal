import express from 'express';
import {
  signUp,
  signIn,
  signOut,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  updateAvailability
} from '../controllers/authController.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { body, validationResult } from 'express-validator';
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

// Sign up new user
router.post('/signup',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
    body('role').optional().isIn(['client', 'reader']).withMessage('Role must be client or reader')
  ],
  handleValidationErrors,
  signUp
);

// Sign up reader (admin only)
router.post('/signup/reader',
  authMiddleware,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
    body('specialties').optional().isArray().withMessage('Specialties must be an array'),
    body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be 1000 characters or less'),
    body('per_minute_rate_chat').optional().isInt({ min: 100, max: 10000 }).withMessage('Chat rate must be between $1-$100 per minute'),
    body('per_minute_rate_phone').optional().isInt({ min: 100, max: 10000 }).withMessage('Phone rate must be between $1-$100 per minute'),
    body('per_minute_rate_video').optional().isInt({ min: 100, max: 10000 }).withMessage('Video rate must be between $1-$100 per minute')
  ],
  handleValidationErrors,
  (req, res, next) => {
    req.body.role = 'reader';
    next();
  },
  signUp
);

// Sign in user
router.post('/signin',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  signIn
);

// Alternative login endpoint
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  signIn
);

// Sign out user
router.post('/signout', authMiddleware, signOut);
router.post('/logout', authMiddleware, signOut);

// Refresh token
router.post('/refresh',
  [
    body('refresh_token').notEmpty().withMessage('Refresh token is required')
  ],
  handleValidationErrors,
  refreshToken
);

// Get current user profile
router.get('/profile', authMiddleware, getProfile);

// Update user profile
router.put('/profile',
  authMiddleware,
  [
    body('full_name').optional().isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
    body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be 1000 characters or less'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('timezone').optional().isString().withMessage('Timezone must be a string'),
    body('specialties').optional().isArray().withMessage('Specialties must be an array'),
    body('per_minute_rate_chat').optional().isInt({ min: 100, max: 10000 }).withMessage('Chat rate must be between $1-$100 per minute'),
    body('per_minute_rate_phone').optional().isInt({ min: 100, max: 10000 }).withMessage('Phone rate must be between $1-$100 per minute'),
    body('per_minute_rate_video').optional().isInt({ min: 100, max: 10000 }).withMessage('Video rate must be between $1-$100 per minute')
  ],
  handleValidationErrors,
  updateProfile
);

// Change password
router.put('/password',
  authMiddleware,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  handleValidationErrors,
  changePassword
);

// Update reader availability
router.put('/availability',
  authMiddleware,
  [
    body('is_online').isBoolean().withMessage('is_online must be a boolean value')
  ],
  handleValidationErrors,
  updateAvailability
);

// Check authentication status
router.get('/me', authMiddleware, (req, res) => {
  res.status(StatusCodes.OK).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      profile: req.user.profile
    }
  });
});

export default router;
