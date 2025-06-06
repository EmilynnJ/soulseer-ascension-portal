import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import { AppError } from '../middleware/errorMiddleware.js';

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('Error with email configuration:', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendEmail = async (options) => {
  // In development, log the email instead of sending it
  if (process.env.NODE_ENV === 'development' && process.env.LOG_EMAILS === 'true') {
    console.log('=== EMAIL NOT SENT (development mode) ===');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body:', options.text || options.html);
    console.log('======================================');
    return Promise.resolve();
  }

  // In production or when LOG_EMAILS is false, send the actual email
  const mailOptions = {
    from: `"SoulSeer" <${process.env.EMAIL_FROM || process.env.SMTP_USERNAME}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new AppError('There was an error sending the email. Please try again later.', 500);
  }
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} token - Password reset token
 * @param {string} name - User's name
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendPasswordResetEmail = async (to, token, name) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>Hello ${name || 'there'},</p>
      <p>You are receiving this email because you (or someone else) has requested a password reset for your account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        If you're having trouble with the button above, copy and paste the URL below into your web browser.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Password Reset Request - SoulSeer',
    html,
  });
};

/**
 * Send a welcome email with verification link
 * @param {string} to - Recipient email address
 * @param {string} token - Email verification token
 * @param {string} name - User's name
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendWelcomeEmail = async (to, token, name) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">Welcome to SoulSeer, ${name || 'there'}!</h2>
      <p>Thank you for signing up. We're excited to have you on board!</p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      <div style="margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p>If you did not create an account, no further action is required.</p>
      <p>Best regards,<br>The SoulSeer Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to SoulSeer - Verify Your Email',
    html,
  });
};

/**
 * Send an email verification link
 * @param {string} to - Recipient email address
 * @param {string} token - Email verification token
 * @param {string} name - User's name
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendVerificationEmail = async (to, token, name) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">Verify Your Email Address</h2>
      <p>Hello ${name || 'there'},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p>If you did not create an account, no further action is required.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Verify Your Email - SoulSeer',
    html,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
};
