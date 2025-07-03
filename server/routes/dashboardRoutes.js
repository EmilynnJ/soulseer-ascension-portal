import express from 'express';
import { requireAuth } from '@clerk/express';
import { neonPool } from '../config/neon.js';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

// Get client dashboard data
router.get('/client', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      // Get user profile
      const profileResult = await client.query(
        'SELECT * FROM profiles WHERE clerk_id = $1',
        [clerkId]
      );
      
      if (profileResult.rows.length === 0) {
        return res.json({
          stats: {
            totalSpent: 0,
            totalSessions: 0,
            favoriteReaders: 0,
            monthlySpent: 0,
            averageSessionLength: 0,
            walletBalance: 0
          },
          sessions: [],
          favoriteReaders: []
        });
      }
      
      const profile = profileResult.rows[0];
      
      // Get session stats
      const sessionsResult = await client.query(
        `SELECT rs.*, bt.amount as total_cost, 
                EXTRACT(EPOCH FROM (rs.end_time - rs.start_time))/60 as duration_minutes
         FROM reading_sessions rs
         LEFT JOIN billing_transactions bt ON rs.id = bt.session_id
         WHERE rs.client_id = $1 AND rs.status = 'completed'`,
        [profile.id]
      );
      
      const sessions = sessionsResult.rows;
      const totalSpent = sessions.reduce((sum, session) => sum + (session.total_cost || 0), 0);
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
      
      // Calculate monthly spending
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - 1);
      const monthlySpent = sessions
        .filter(s => new Date(s.created_at) >= monthStart)
        .reduce((sum, session) => sum + (session.total_cost || 0), 0);
      
      const stats = {
        totalSpent: totalSpent / 100, // Convert from cents
        totalSessions: sessions.length,
        favoriteReaders: 0,
        monthlySpent: monthlySpent / 100,
        averageSessionLength: sessions.length > 0 ? totalMinutes / sessions.length : 0,
        walletBalance: profile.balance || 0
      };
      
      // Get recent sessions with reader info
      const recentSessionsResult = await client.query(
        `SELECT rs.*, rp.display_name as reader_name, rp.profile_image as reader_profile_image,
                bt.amount as total_cost,
                EXTRACT(EPOCH FROM (rs.end_time - rs.start_time))/60 as duration_minutes
         FROM reading_sessions rs
         JOIN profiles rp ON rs.reader_id = rp.id
         LEFT JOIN billing_transactions bt ON rs.id = bt.session_id
         WHERE rs.client_id = $1
         ORDER BY rs.created_at DESC
         LIMIT 10`,
        [profile.id]
      );
      
      const recentSessions = recentSessionsResult.rows.map(session => ({
        ...session,
        total_cost: (session.total_cost || 0) / 100 // Convert from cents
      }));
      
      res.json({
        stats,
        sessions: recentSessions,
        favoriteReaders: [] // TODO: Implement favorite readers logic
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to load dashboard data' });
  }
});

// Get reader dashboard data
router.get('/reader', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      // Get reader profile
      const profileResult = await client.query(
        'SELECT * FROM profiles WHERE clerk_id = $1 AND role = $2',
        [clerkId, 'reader']
      );
      
      if (profileResult.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Reader profile not found' });
      }
      
      const profile = profileResult.rows[0];
      
      // Get earnings and session stats
      const sessionsResult = await client.query(
        `SELECT rs.*, bt.amount as earnings,
                EXTRACT(EPOCH FROM (rs.end_time - rs.start_time))/60 as duration_minutes
         FROM reading_sessions rs
         LEFT JOIN billing_transactions bt ON rs.id = bt.session_id
         WHERE rs.reader_id = $1 AND rs.status = 'completed'`,
        [profile.id]
      );
      
      const sessions = sessionsResult.rows;
      const totalEarnings = sessions.reduce((sum, session) => sum + (session.earnings || 0), 0) * 0.7; // 70% to reader
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
      
      const stats = {
        totalEarnings: totalEarnings / 100, // Convert from cents
        totalSessions: sessions.length,
        totalMinutes,
        averageRating: profile.rating_avg || 0,
        totalReviews: profile.total_reviews || 0
      };
      
      res.json({
        stats,
        sessions: sessions.map(session => ({
          ...session,
          earnings: ((session.earnings || 0) * 0.7) / 100 // Convert from cents and apply 70% split
        }))
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reader dashboard error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to load reader dashboard data' });
  }
});

// Get admin dashboard data
router.get('/admin', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const client = await neonPool.connect();
    
    try {
      // Verify admin role
      const profileResult = await client.query(
        'SELECT role FROM profiles WHERE clerk_id = $1',
        [clerkId]
      );
      
      if (profileResult.rows.length === 0 || profileResult.rows[0].role !== 'admin') {
        return res.status(StatusCodes.FORBIDDEN).json({ error: 'Admin access required' });
      }
      
      // Get platform stats
      const [usersResult, sessionsResult, revenueResult] = await Promise.all([
        client.query('SELECT COUNT(*) as total_users, role FROM profiles GROUP BY role'),
        client.query('SELECT COUNT(*) as total_sessions, status FROM reading_sessions GROUP BY status'),
        client.query('SELECT SUM(amount) as total_revenue FROM billing_transactions WHERE status = $1', ['succeeded'])
      ]);
      
      const stats = {
        totalUsers: usersResult.rows.reduce((sum, row) => sum + parseInt(row.total_users), 0),
        totalReaders: usersResult.rows.find(row => row.role === 'reader')?.total_users || 0,
        totalClients: usersResult.rows.find(row => row.role === 'client')?.total_users || 0,
        totalSessions: sessionsResult.rows.reduce((sum, row) => sum + parseInt(row.total_sessions), 0),
        totalRevenue: (revenueResult.rows[0]?.total_revenue || 0) / 100 // Convert from cents
      };
      
      res.json({ stats });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to load admin dashboard data' });
  }
});

export default router;