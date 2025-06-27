import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neonPool } from '../config/neon.js';

export class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId, email, role = 'client') {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static async createUser(email, password, role = 'client') {
    const client = await neonPool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );

      const user = userResult.rows[0];

      // Create profile
      const profileResult = await client.query(
        `INSERT INTO profiles (user_id, email, role, display_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, display_name, role, balance, is_available`,
        [user.id, email, role, email.split('@')[0]]
      );

      const profile = profileResult.rows[0];

      await client.query('COMMIT');

      return {
        user: {
          id: user.id,
          email: user.email,
          profile: profile
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async authenticateUser(email, password) {
    const client = await neonPool.connect();
    try {
      // Get user with profile
      const result = await client.query(
        `SELECT u.id, u.email, u.password_hash, 
                p.id as profile_id, p.display_name, p.role, p.balance, 
                p.is_available, p.status, p.profile_image
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user.id, user.email, user.role);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          profile: {
            id: user.profile_id,
            display_name: user.display_name,
            role: user.role,
            balance: user.balance,
            is_available: user.is_available,
            status: user.status,
            profile_image: user.profile_image
          }
        }
      };
    } finally {
      client.release();
    }
  }

  static async getUserById(userId) {
    const client = await neonPool.connect();
    try {
      const result = await client.query(
        `SELECT u.id, u.email, 
                p.id as profile_id, p.display_name, p.role, p.balance, 
                p.is_available, p.status, p.profile_image, p.bio, p.specialties,
                p.chat_rate, p.audio_rate, p.video_rate, p.rating_avg, p.total_reviews
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        profile: {
          id: user.profile_id,
          display_name: user.display_name,
          role: user.role,
          balance: user.balance,
          is_available: user.is_available,
          status: user.status,
          profile_image: user.profile_image,
          bio: user.bio,
          specialties: user.specialties,
          chat_rate: user.chat_rate,
          audio_rate: user.audio_rate,
          video_rate: user.video_rate,
          rating_avg: user.rating_avg,
          total_reviews: user.total_reviews
        }
      };
    } finally {
      client.release();
    }
  }

  static async updateUserStatus(userId, status) {
    const client = await neonPool.connect();
    try {
      await client.query(
        'UPDATE profiles SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE user_id = $2',
        [status, userId]
      );
    } finally {
      client.release();
    }
  }
}