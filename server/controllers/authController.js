import { getSupabase } from '../config/supabase.js';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Sign up new user
export const signUp = async (req, res) => {
  try {
    const { email, password, fullName, role = 'client' } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Email, password, and full name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.(email)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Validate role
    if (!['client', 'reader'].includes(role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Role must be either client or reader'
      });
    }

    // Only admins can create reader accounts
    if (role === 'reader' && (!req.user || req.user.role !== 'admin')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'Only administrators can create reader accounts'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    
    if (existingUser.user) {
      return res.status(StatusCodes.CONFLICT).json({
        error: 'User with this email already exists'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for production
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create user account'
      });
    }

    // Create user profile
    const profileData = {
      user_id: authData.user.id,
      full_name: fullName,
      role: role,
      balance: role === 'client' ? 0 : null,
      is_online: false
    };

    // Add reader-specific fields
    if (role === 'reader') {
      profileData.per_minute_rate_chat = 300; // $3.00 default
      profileData.per_minute_rate_phone = 400; // $4.00 default  
      profileData.per_minute_rate_video = 500; // $5.00 default
      profileData.rating = 0;
      profileData.total_reviews = 0;
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create user profile'
      });
    }

    // Generate access token for immediate login
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });

    res.status(StatusCodes.CREATED).json({
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role: role
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Sign in user
export const signIn = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Email and password are required'
      });
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Sign in error:', authError);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Invalid email or password'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch user profile'
      });
    }

    // Update last login time
    await supabase
      .from('user_profiles')
      .update({ 
        last_seen: new Date().toISOString(),
        is_online: true
      })
      .eq('user_id', authData.user.id);

    res.status(StatusCodes.OK).json({
      message: 'Sign in successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        full_name: profile.full_name,
        profile: profile
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Sign out user
export const signOut = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user?.id;

    if (userId) {
      // Update user offline status
      await supabase
        .from('user_profiles')
        .update({ is_online: false })
        .eq('user_id', userId);
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
    }

    res.status(StatusCodes.OK).json({
      message: 'Sign out successful'
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Refresh token is required'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      console.error('Refresh token error:', error);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Invalid refresh token'
      });
    }

    res.status(StatusCodes.OK).json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch profile'
      });
    }

    res.status(StatusCodes.OK).json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;
    const allowedFields = [
      'full_name', 'bio', 'avatar_url', 'phone', 'timezone', 
      'specialties', 'per_minute_rate_chat', 'per_minute_rate_phone', 
      'per_minute_rate_video'
    ];

    // Filter only allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Validate rates for readers
    if (req.user.role === 'reader') {
      ['per_minute_rate_chat', 'per_minute_rate_phone', 'per_minute_rate_video'].forEach(field => {
        if (updateData[field] !== undefined) {
          const rate = parseInt(updateData[field]);
          if (isNaN(rate) || rate < 100 || rate > 10000) { // $1 to $100 per minute
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: `${field} must be between $1.00 and $100.00 per minute`
            });
          }
          updateData[field] = rate;
        }
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'No valid fields to update'
      });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update profile'
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Current password and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password by attempting to sign in
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.user.email,
      password: current_password
    });

    if (verifyError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Current password is incorrect'
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: new_password
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update password'
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

// Update reader availability
export const updateAvailability = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { is_online } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'reader') {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'Only readers can update availability'
      });
    }

    if (typeof is_online !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'is_online must be a boolean value'
      });
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_online,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Availability update error:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update availability'
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'Availability updated successfully',
      is_online
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error'
    });
  }
};

export default {
  signUp,
  signIn,
  signOut,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  updateAvailability
};
