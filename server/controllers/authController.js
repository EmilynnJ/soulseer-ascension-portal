import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { sendEmail } from '../utils/email.js';
import { AppError } from '../middleware/errorMiddleware.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d', // Default to 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { email, password, firstName, lastName, phoneNumber, dateOfBirth } = req.body;
    const role = 'client'; // Force role to 'client' for public registration

    await client.query('BEGIN');

    // Check if user already exists
    const userExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const result = await client.query(
      `INSERT INTO users 
       (email, password_hash, first_name, last_name, phone_number, date_of_birth, role, verification_token, verification_expires) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, email, first_name, last_name, role, is_verified`,
      [email, hashedPassword, firstName, lastName, phoneNumber, dateOfBirth, role, verificationToken, verificationExpires]
    );

    const user = result.rows[0];

    // Create user wallet with zero balance
    await client.query(
      'INSERT INTO user_wallets (user_id, balance) VALUES ($1, 0)',
      [user.id]
    );

    // If reader, create reader profile
    if (role === 'reader') {
      await client.query(
        'INSERT INTO readers (user_id) VALUES ($1)',
        [user.id]
      );
    }

    await client.query('COMMIT');

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - SoulSeer',
        html: `
          <h2>Welcome to SoulSeer, ${user.first_name}!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const userQuery = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Remove password from output
    delete user.password_hash;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const userQuery = await pool.query(
      `SELECT id, email, first_name, last_name, phone_number, date_of_birth, role, is_verified, 
              created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get wallet balance
    const walletQuery = await pool.query(
      'SELECT balance FROM user_wallets WHERE user_id = $1',
      [user.id]
    );

    const wallet = walletQuery.rows[0] || { balance: 0 };

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        dateOfBirth: user.date_of_birth,
        role: user.role,
        isVerified: user.is_verified,
        balance: wallet.balance,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { email } = req.body;

    const userQuery = await client.query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (10 minutes)
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await client.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetPasswordToken, resetPasswordExpire, user.id]
    );

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - SoulSeer',
        html: `
          <h2>Password Reset Request</h2>
          <p>You are receiving this email because you (or someone else) has requested a password reset for your account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `
      });

      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    } catch (error) {
      console.error('Email send error:', error);
      
      await client.query(
        'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
        [user.id]
      );

      return next(new AppError('Email could not be sent', 500));
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Forgot password error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const userQuery = await client.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [resetPasswordToken]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return next(new AppError('Invalid or expired token', 400));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Update password and clear reset token
    await client.query(
      `UPDATE users 
       SET password_hash = $1, 
           reset_password_token = NULL, 
           reset_password_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset password error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      email: req.body.email,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      phone_number: req.body.phoneNumber,
      date_of_birth: req.body.dateOfBirth
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }


    // If email is being updated, reset verification status
    if (fieldsToUpdate.email) {
      fieldsToUpdate.is_verified = false;
      // Generate new verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');
      fieldsToUpdate.verification_token = verificationToken;
      fieldsToUpdate.verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const values = Object.values(fieldsToUpdate);
    values.push(req.user.id);

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $${values.length} 
      RETURNING id, email, first_name, last_name, phone_number, date_of_birth, role, is_verified
    `;

    const result = await pool.query(query, values);
    const user = result.rows[0];

    // If email was updated, send verification email
    if (fieldsToUpdate.email) {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${fieldsToUpdate.verification_token}`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Updated Email - SoulSeer',
          html: `
            <h2>Verify Your Updated Email</h2>
            <p>Please verify your new email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the request if email sending fails
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        dateOfBirth: user.date_of_birth,
        role: user.role,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Update details error:', error);
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const userQuery = await client.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Generate new token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update password error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { token } = req.params;

    const userQuery = await client.query(
      'SELECT id, email, verification_token, verification_expires FROM users WHERE verification_token = $1',
      [token]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if token is expired
    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.'
      });
    }

    // Update user
    await client.query(
      `UPDATE users 
       SET is_verified = TRUE, 
           verification_token = NULL, 
           verification_expires = NULL 
       WHERE id = $1`,
      [user.id]
    );

    // Generate token
    const authToken = generateToken(user.id);

    // Set cookie
    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Redirect to success page or return success response
    if (req.accepts('html')) {
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified`);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token: authToken
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verify email error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { email } = req.body;

    const userQuery = await client.query(
      'SELECT id, email, first_name, is_verified FROM users WHERE email = $1',
      [email]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.'
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await client.query(
      'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - SoulSeer',
        html: `
          <h2>Verify Your Email</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        `
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      
      await client.query(
        'UPDATE users SET verification_token = NULL, verification_expires = NULL WHERE id = $1',
        [user.id]
      );

      return next(new AppError('Email could not be sent', 500));
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Resend verification email error:', error);
    next(error);
  } finally {
    client.release();
  }
};
