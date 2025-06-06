import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { getSupabase } from '../config/supabase.js';

// Protect routes - user must be authenticated
export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Get token from cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
    try {
      // Verify token (JWT from our own auth)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the database
      const userQuery = await pool.query(
        'SELECT id, email, first_name, last_name, role, is_verified FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userQuery.rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      req.user = userQuery.rows[0];
      next();
    } catch (error) {
      // If JWT verification fails, try Supabase token
      if (error.name === 'JsonWebTokenError') {
        try {
          const { data: { user }, error: supabaseError } = await getSupabase()
            .auth
            .getUser(token);
            
          if (supabaseError) throw supabaseError;
          
          // Get user from the database
          const userQuery = await pool.query(
            'SELECT id, email, first_name, last_name, role, is_verified FROM users WHERE id = $1',
            [user.id]
          );
          
          if (userQuery.rows.length === 0) {
            return res.status(401).json({ 
              success: false, 
              message: 'User not found' 
            });
          }
          
          req.user = userQuery.rows[0];
          next();
        } catch (supabaseErr) {
          console.error('Supabase auth error:', supabaseErr);
          return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, token failed' 
          });
        }
      } else {
        console.error('JWT error:', error);
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized, token failed' 
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// Check if user is verified
export const checkVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Please verify your email address to access this feature' 
    });
  }
  next();
};

// Check if user has sufficient balance (for clients)
export const checkBalance = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT balance FROM user_wallets WHERE user_id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0 || rows[0].balance <= 0) {
      return res.status(402).json({ 
        success: false, 
        message: 'Insufficient balance. Please add funds to your wallet.' 
      });
    }
    
    req.user.balance = rows[0].balance;
    next();
  } catch (error) {
    console.error('Balance check error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking account balance' 
    });
  }
};

// Check if reader is available
export const checkReaderAvailability = async (req, res, next) => {
  try {
    const { readerId } = req.params;
    
    const { rows } = await pool.query(
      `SELECT r.is_available, r.is_verified, u.first_name, u.last_name 
       FROM readers r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = $1`,
      [readerId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reader not found' 
      });
    }
    
    const reader = rows[0];
    
    if (!reader.is_verified) {
      return res.status(403).json({ 
        success: false, 
        message: 'This reader is not verified yet' 
      });
    }
    
    if (!reader.is_available) {
      return res.status(403).json({ 
        success: false, 
        message: `${reader.first_name} is currently not available for readings` 
      });
    }
    
    next();
  } catch (error) {
    console.error('Reader availability check error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking reader availability' 
    });
  }
};
