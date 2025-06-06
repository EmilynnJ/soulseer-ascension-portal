import { validationResult } from 'express-validator';

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle 404 Not Found
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
};

// Handle validation errors
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err);

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }

  // Handle token expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired. Please log in again.'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
  }

  // Handle duplicate field errors
  if (err.code === '23505) { // PostgreSQL unique violation
    const field = err.detail.match(/\(([^)]+)\)/)[1];
    return res.status(400).json({
      success: false,
      message: `${field} is already in use`
    });
  }

  // Handle foreign key violations
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. The referenced record does not exist.'
    });
  }

  // Handle invalid input syntax
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input syntax. Please check your request data.'
    });
  }

  // Handle other operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }

  // Handle unexpected errors in production vs development
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: err,
      stack: err.stack
    });
  }

  // Production error handling
  res.status(500).json({
    success: false,
    message: 'Something went wrong! Please try again later.'
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  process.exit(1);
});

export default {
  AppError,
  notFound,
  validate,
  errorHandler
};
