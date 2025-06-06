import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { getSupabase } from '../config/supabase.js';

// @desc    Get reader profile
// @route   GET /api/readers/:id
// @access  Public
export const getReaderProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get basic reader info
    const readerQuery = await pool.query(
      `SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone_number, u.date_of_birth, u.created_at,
        r.bio, r.specialties, r.languages, r.experience_years, r.response_time, 
        r.hourly_rate, r.rating, r.total_sessions, r.is_available, r.is_verified,
        r.verification_documents, r.created_at as reader_since
      FROM users u
      JOIN readers r ON u.id = r.user_id
      WHERE u.id = $1 AND u.role = 'reader'`,
      [id]
    );

    if (readerQuery.rows.length === 0) {
      return next(new AppError('Reader not found', 404));
    }

    const reader = readerQuery.rows[0];

    // Get reader's schedule
    const scheduleQuery = await pool.query(
      `SELECT day_of_week, start_time, end_time, is_available 
       FROM reader_schedules 
       WHERE reader_id = $1`,
      [id]
    );

    // Get reader's reviews
    const reviewsQuery = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.reader_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [id]
    );

    // Calculate average rating
    const avgRatingQuery = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews 
       WHERE reader_id = $1`,
      [id]
    );

    const { avg_rating, total_reviews } = avgRatingQuery.rows[0];

    // Format response
    const response = {
      id: reader.id,
      firstName: reader.first_name,
      lastName: reader.last_name,
      email: reader.email,
      phoneNumber: reader.phone_number,
      dateOfBirth: reader.date_of_birth,
      bio: reader.bio,
      specialties: reader.specialties || [],
      languages: reader.languages || ['English'],
      experienceYears: reader.experience_years || 0,
      responseTime: reader.response_time || 'Within 24 hours',
      hourlyRate: parseFloat(reader.hourly_rate) || 0,
      rating: parseFloat(avg_rating) || 0,
      totalSessions: parseInt(reader.total_sessions) || 0,
      totalReviews: parseInt(total_reviews) || 0,
      isAvailable: reader.is_available,
      isVerified: reader.is_verified,
      readerSince: reader.reader_since,
      schedule: scheduleQuery.rows,
      recentReviews: reviewsQuery.rows,
      verificationDocuments: reader.verification_documents || []
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get reader profile error:', error);
    next(error);
  }
};

// @desc    Update reader profile
// @route   PUT /api/readers/me/profile
// @access  Private/Reader
export const updateReaderProfile = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const {
      bio,
      specialties,
      languages,
      experienceYears,
      responseTime,
      hourlyRate
    } = req.body;

    await client.query('BEGIN');

    // Check if user is a reader
    const readerCheck = await client.query(
      'SELECT 1 FROM readers WHERE user_id = $1',
      [userId]
    );

    if (readerCheck.rows.length === 0) {
      return next(new AppError('Reader profile not found', 404));
    }

    // Update reader profile
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    
    if (specialties) {
      updateFields.push(`specialties = $${paramCount++}`);
      values.push(Array.isArray(specialties) ? specialties : [specialties]);
    }
    
    if (languages) {
      updateFields.push(`languages = $${paramCount++}`);
      values.push(Array.isArray(languages) ? languages : [languages]);
    }
    
    if (experienceYears !== undefined) {
      updateFields.push(`experience_years = $${paramCount++}`);
      values.push(parseInt(experienceYears));
    }
    
    if (responseTime) {
      updateFields.push(`response_time = $${paramCount++}`);
      values.push(responseTime);
    }
    
    if (hourlyRate !== undefined) {
      updateFields.push(`hourly_rate = $${paramCount++}`);
      values.push(parseFloat(hourlyRate));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Add updated_at to the update fields
    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE readers 
      SET ${updateFields.join(', ')} 
      WHERE user_id = $${paramCount}
      RETURNING *`;
    
    values.push(userId);
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      throw new AppError('Failed to update reader profile', 500);
    }

    await client.query('COMMIT');

    // Get updated reader profile
    const updatedProfile = await getReaderProfile({ params: { id: userId } }, res, next);
    
    return updatedProfile;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update reader profile error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Update reader availability
// @route   PUT /api/readers/me/availability
// @access  Private/Reader
export const updateReaderAvailability = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { isAvailable, unavailableUntil } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE readers 
       SET is_available = $1, 
           unavailable_until = $2,
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING is_available, unavailable_until`,
      [isAvailable, unavailableUntil || null, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Reader not found', 404);
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      data: {
        isAvailable: result.rows[0].is_available,
        unavailableUntil: result.rows[0].unavailable_until
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update reader availability error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Get reader reviews
// @route   GET /api/readers/:id/reviews
// @access  Public
export const getReaderReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if reader exists
    const readerCheck = await pool.query(
      'SELECT 1 FROM readers WHERE user_id = $1',
      [id]
    );

    if (readerCheck.rows.length === 0) {
      return next(new AppError('Reader not found', 404));
    }

    // Get paginated reviews
    const reviewsQuery = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id as client_id, u.first_name, u.last_name, u.avatar_url,
              s.session_type, s.start_time as session_date
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       LEFT JOIN sessions s ON r.session_id = s.id
       WHERE r.reader_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // Get total count for pagination
    const countQuery = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE reader_id = $1',
      [id]
    );

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    // Calculate average rating
    const avgRatingQuery = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE reader_id = $1',
      [id]
    );

    const avgRating = parseFloat(avgRatingQuery.rows[0].avg_rating) || 0;

    // Get rating distribution
    const distributionQuery = await pool.query(
      `SELECT rating, COUNT(*) as count
       FROM reviews
       WHERE reader_id = $1
       GROUP BY rating
       ORDER BY rating DESC`,
      [id]
    );

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    distributionQuery.rows.forEach(row => {
      ratingDistribution[row.rating] = parseInt(row.count);
    });

    res.status(200).json({
      success: true,
      data: {
        reviews: reviewsQuery.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        summary: {
          averageRating: avgRating,
          totalReviews: total,
          ratingDistribution
        }
      }
    });
  } catch (error) {
    console.error('Get reader reviews error:', error);
    next(error);
  }
};

// @desc    Get available readers
// @route   GET /api/readers/available
// @access  Public
export const getAvailableReaders = async (req, res, next) => {
  try {
    const { category, minRating, language, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build the query
    let query = `
      SELECT 
        u.id, u.first_name, u.last_name, u.avatar_url,
        r.bio, r.specialties, r.languages, r.experience_years, 
        r.response_time, r.hourly_rate, r.rating, r.total_sessions,
        r.is_available, r.is_verified,
        (
          SELECT COUNT(*) 
          FROM reviews 
          WHERE reader_id = u.id
        ) as total_reviews
      FROM users u
      JOIN readers r ON u.id = r.user_id
      WHERE u.role = 'reader' AND r.is_available = true
    `;

    const queryParams = [];
    let paramCount = 1;

    // Add filters
    if (category) {
      query += ` AND $${paramCount} = ANY(r.specialties)`;
      queryParams.push(category);
      paramCount++;
    }

    if (minRating) {
      query += ` AND r.rating >= $${paramCount}`;
      queryParams.push(parseFloat(minRating));
      paramCount++;
    }

    if (language) {
      query += ` AND $${paramCount} = ANY(r.languages)`;
      queryParams.push(language);
      paramCount++;
    }

    // Add sorting and pagination
    query += `
      ORDER BY 
        r.is_available DESC,
        r.rating DESC NULLS LAST,
        r.total_sessions DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    queryParams.push(parseInt(limit), offset);

    // Execute the query
    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*)
      FROM users u
      JOIN readers r ON u.id = r.user_id
      WHERE u.role = 'reader' AND r.is_available = true
    `;
    
    const countParams = [];
    let countParamCount = 1;

    if (category) {
      countQuery += ` AND $${countParamCount} = ANY(r.specialties)`;
      countParams.push(category);
      countParamCount++;
    }

    if (minRating) {
      countQuery += ` AND r.rating >= $${countParamCount}`;
      countParams.push(parseFloat(minRating));
      countParamCount++;
    }

    if (language) {
      countQuery += ` AND $${countParamCount} = ANY(r.languages)`;
      countParams.push(language);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    // Format response
    const readers = result.rows.map(reader => ({
      id: reader.id,
      firstName: reader.first_name,
      lastName: reader.last_name,
      avatarUrl: reader.avatar_url,
      bio: reader.bio,
      specialties: reader.specialties || [],
      languages: reader.languages || ['English'],
      experienceYears: reader.experience_years || 0,
      responseTime: reader.response_time || 'Within 24 hours',
      hourlyRate: parseFloat(reader.hourly_rate) || 0,
      rating: parseFloat(reader.rating) || 0,
      totalSessions: parseInt(reader.total_sessions) || 0,
      totalReviews: parseInt(reader.total_reviews) || 0,
      isAvailable: reader.is_available,
      isVerified: reader.is_verified
    }));

    res.status(200).json({
      success: true,
      data: {
        readers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get available readers error:', error);
    next(error);
  }
};

// @desc    Search readers
// @route   GET /api/readers/search
// @access  Public
export const searchReaders = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    const searchQuery = `%${query}%`;
    
    // Search in reader profiles
    const result = await pool.query(
      `SELECT 
          u.id, u.first_name, u.last_name, u.avatar_url,
          r.bio, r.specialties, r.languages, r.rating, 
          r.total_sessions, r.is_available, r.is_verified,
          ts_rank(
            to_tsvector('english', 
              COALESCE(u.first_name, '') || ' ' || 
              COALESCE(u.last_name, '') || ' ' || 
              COALESCE(r.bio, '') || ' ' || 
              COALESCE(array_to_string(r.specialties, ' '), '')
            ),
            plainto_tsquery('english', $1)
          ) as rank
       FROM users u
       JOIN readers r ON u.id = r.user_id
       WHERE 
         to_tsvector('english', 
           COALESCE(u.first_name, '') || ' ' || 
           COALESCE(u.last_name, '') || ' ' || 
           COALESCE(r.bio, '') || ' ' || 
           COALESCE(array_to_string(r.specialties, ' '), '')
         ) @@ plainto_tsquery('english', $1)
         OR u.first_name ILIKE $2
         OR u.last_name ILIKE $2
         OR r.bio ILIKE $2
         OR $3 = ANY(r.specialties)
       ORDER BY 
         r.is_available DESC,
         rank DESC,
         r.rating DESC NULLS LAST
       LIMIT $4 OFFSET $5`,
      [query, searchQuery, query, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM users u
       JOIN readers r ON u.id = r.user_id
       WHERE 
         to_tsvector('english', 
           COALESCE(u.first_name, '') || ' ' || 
           COALESCE(u.last_name, '') || ' ' || 
           COALESCE(r.bio, '') || ' ' || 
           COALESCE(array_to_string(r.specialties, ' '), '')
         ) @@ plainto_tsquery('english', $1)
         OR u.first_name ILIKE $2
         OR u.last_name ILIKE $2
         OR r.bio ILIKE $2
         OR $3 = ANY(r.specialties)`,
      [query, searchQuery, query]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    // Format response
    const readers = result.rows.map(reader => ({
      id: reader.id,
      firstName: reader.first_name,
      lastName: reader.last_name,
      avatarUrl: reader.avatar_url,
      bio: reader.bio,
      specialties: reader.specialties || [],
      languages: reader.languages || ['English'],
      rating: parseFloat(reader.rating) || 0,
      totalSessions: parseInt(reader.total_sessions) || 0,
      isAvailable: reader.is_available,
      isVerified: reader.is_verified
    }));

    res.status(200).json({
      success: true,
      data: {
        readers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        searchQuery: query
      }
    });
  } catch (error) {
    console.error('Search readers error:', error);
    next(error);
  }
};
