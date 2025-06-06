import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/errorMiddleware.js';
import { 
  registerUser, 
  loginUser, 
  getMe, 
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
  verifyEmail,
  resendVerificationEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post(
  '/register',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    validate
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
    validate
  ],
  loginUser
);

router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', [
  body('email', 'Please include a valid email').isEmail(),
  validate
], resendVerificationEmail);

router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail(),
  validate
], forgotPassword);

router.put('/reset-password/:resettoken', [
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  body('confirmPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.password),
  validate
], resetPassword);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', getMe);
router.put('/updatedetails', [
  body('email', 'Please include a valid email').optional().isEmail(),
  body('firstName', 'First name is required').optional().not().isEmpty(),
  body('lastName', 'Last name is required').optional().not().isEmpty(),
  validate
], updateDetails);

router.put('/updatepassword', [
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  validate
], updatePassword);

router.post('/logout', logout);

export default router;
