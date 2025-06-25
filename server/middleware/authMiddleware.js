import { getSupabase } from '../config/supabase.js';
import { StatusCodes } from 'http-status-codes';

export const authMiddleware = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Invalid or expired token'
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', profileError);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch user profile'
      });
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'client',
      profile: profile || null
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['admin']);

// Reader only middleware
export const requireReader = requireRole(['reader', 'admin']);

// Client only middleware (though clients can access most endpoints)
export const requireClient = requireRole(['client', 'admin']);

export default {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireReader,
  requireClient
};
