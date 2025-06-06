import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const getReaderSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Validate dates or use defaults
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    end.setDate(end.getDate() + 14); // Default to 2 weeks

    // Get reader's recurring schedule
    const scheduleQuery = await pool.query(
      `SELECT id, day_of_week, start_time, end_time, is_available, is_recurring
       FROM reader_schedules 
       WHERE reader_id = $1
       ORDER BY day_of_week, start_time`,
      [id]
    );

    // Get reader's specific availability overrides
    const overridesQuery = await pool.query(
      `SELECT id, date, start_time, end_time, is_available, reason
       FROM reader_availability_overrides
       WHERE reader_id = $1 
         AND date BETWEEN $2 AND $3
       ORDER BY date, start_time`,
      [id, start, end]
    );

    // Get reader's blocked dates
    const blockedDatesQuery = await pool.query(
      `SELECT id, date, start_time, end_time, reason, is_all_day
       FROM reader_blocked_dates 
       WHERE reader_id = $1 
         AND (
           (date BETWEEN $2 AND $3) OR
           (is_recurring = true AND 
            EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM $2::date) AND
            EXTRACT(DAY FROM date) = EXTRACT(DAY FROM $2::date))
         )`,
      [id, start, end]
    );

    // Get reader's timezone
    const timezoneQuery = await pool.query(
      `SELECT timezone FROM reader_settings WHERE user_id = $1`,
      [id]
    );
    
    const timezone = timezoneQuery.rows[0]?.timezone || 'UTC';

    res.status(200).json({
      success: true,
      data: {
        schedule: scheduleQuery.rows,
        availabilityOverrides: overridesQuery.rows,
        blockedDates: blockedDatesQuery.rows,
        timezone,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get reader schedule error:', error);
    next(error);
  }
};

export const updateReaderSchedule = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { timeSlots } = req.body;
    const userId = req.user.id;

    // Verify the user is updating their own schedule
    if (id !== userId) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    if (!Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        message: 'Time slots must be an array'
      });
    }

    await client.query('BEGIN');

    // Delete existing schedule
    await client.query(
      'DELETE FROM reader_schedules WHERE reader_id = $1',
      [id]
    );

    // Insert new schedule
    for (const slot of timeSlots) {
      const { dayOfWeek, startTime, endTime, isAvailable = true, isRecurring = true } = slot;
      
      if (dayOfWeek === undefined || startTime === undefined || endTime === undefined) {
        await client.query('ROLLBACK');
        return next(new AppError('Each time slot must include dayOfWeek, startTime, and endTime', 400));
      }

      await client.query(
        `INSERT INTO reader_schedules 
         (reader_id, day_of_week, start_time, end_time, is_available, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, dayOfWeek, startTime, endTime, isAvailable, isRecurring]
      );
    }

    await client.query('COMMIT');

    // Return the updated schedule
    const updatedSchedule = await getReaderSchedule({ params: { id } }, res, next);
    return updatedSchedule;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update reader schedule error:', error);
    next(error);
  } finally {
    client.release();
  }
};

export const addBlockedDate = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { date, startTime, endTime, reason, isAllDay = false } = req.body;
    const userId = req.user.id;

    // Verify the user is updating their own schedule
    if (id !== userId) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    if (!date) {
      return next(new AppError('Date is required', 400));
    }

    // If not all day, validate times
    if (!isAllDay && (!startTime || !endTime)) {
      return next(new AppError('Start time and end time are required when not blocking all day', 400));
    }

    await client.query('BEGIN');

    // Check for existing sessions in the blocked period
    const existingSessions = await client.query(
      `SELECT id, start_time, end_time 
       FROM sessions 
       WHERE reader_id = $1 
         AND status IN ('scheduled', 'confirmed')
         AND (
           ($2::date = DATE(start_time) AND $3::time <= end_time AND $4::time >= start_time) OR
           ($2::date = DATE(end_time) AND $3::time <= end_time AND $4::time >= start_time) OR
           (DATE(start_time) < $2::date AND DATE(end_time) > $2::date)
         )`,
      [id, date, startTime || '00:00:00', endTime || '23:59:59']
    );

    if (existingSessions.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot block time with existing sessions',
        conflictingSessions: existingSessions.rows
      });
    }

    // Add blocked date
    const result = await client.query(
      `INSERT INTO reader_blocked_dates 
       (reader_id, date, start_time, end_time, reason, is_all_day, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [
        id,
        date,
        isAllDay ? null : startTime,
        isAllDay ? null : endTime,
        reason || null,
        isAllDay
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add blocked date error:', error);
    next(error);
  } finally {
    client.release();
  }
};

export const removeBlockedDate = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id, blockId } = req.params;
    const userId = req.user.id;

    // Verify the user is updating their own schedule
    if (id !== userId) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM reader_blocked_dates WHERE id = $1 AND reader_id = $2 RETURNING *',
      [blockId, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Blocked date not found', 404));
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Blocked date removed successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Remove blocked date error:', error);
    next(error);
  } finally {
    client.release();
  }
};

export const addAvailabilityOverride = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { date, startTime, endTime, isAvailable, reason } = req.body;
    const userId = req.user.id;

    // Verify the user is updating their own schedule
    if (id !== userId) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    if (!date || startTime === undefined || endTime === undefined || isAvailable === undefined) {
      return next(new AppError('Date, startTime, endTime, and isAvailable are required', 400));
    }

    await client.query('BEGIN');

    // Check for existing overrides that conflict
    const existingOverride = await client.query(
      `SELECT id FROM reader_availability_overrides
       WHERE reader_id = $1 AND date = $2
         AND ((start_time <= $3 AND end_time >= $3)
           OR (start_time <= $4 AND end_time >= $4)
           OR (start_time >= $3 AND end_time <= $4))`,
      [id, date, startTime, endTime]
    );

    if (existingOverride.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'An availability override already exists for this time period',
        conflictId: existingOverride.rows[0].id
      });
    }

    // Add availability override
    const result = await client.query(
      `INSERT INTO reader_availability_overrides 
       (reader_id, date, start_time, end_time, is_available, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, date, startTime, endTime, isAvailable, reason || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add availability override error:', error);
    next(error);
  } finally {
    client.release();
  }
};

export const removeAvailabilityOverride = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id, overrideId } = req.params;
    const userId = req.user.id;

    // Verify the user is updating their own schedule
    if (id !== userId) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM reader_availability_overrides WHERE id = $1 AND reader_id = $2 RETURNING *',
      [overrideId, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Availability override not found', 404));
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Availability override removed successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Remove availability override error:', error);
    next(error);
  } finally {
    client.release();
  }
};

export const getReaderAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, timezone = 'UTC' } = req.query;

    // Validate or set default date range (next 7 days)
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    end.setDate(end.getDate() + 7);

    // Get reader's timezone
    const timezoneQuery = await pool.query(
      'SELECT timezone FROM reader_settings WHERE user_id = $1',
      [id]
    );
    
    const readerTimezone = timezoneQuery.rows[0]?.timezone || 'UTC';

    // Get reader's recurring schedule
    const scheduleQuery = await pool.query(
      `SELECT day_of_week, start_time, end_time, is_available
       FROM reader_schedules 
       WHERE reader_id = $1
       ORDER BY day_of_week, start_time`,
      [id]
    );

    // Get reader's blocked dates
    const blockedDatesQuery = await pool.query(
      `SELECT date, start_time, end_time, is_all_day, reason
       FROM reader_blocked_dates 
       WHERE reader_id = $1 
         AND date BETWEEN $2 AND $3
       ORDER BY date, start_time`,
      [id, start, end]
    );

    // Get reader's availability overrides
    const overridesQuery = await pool.query(
      `SELECT date, start_time, end_time, is_available, reason
       FROM reader_availability_overrides
       WHERE reader_id = $1 
         AND date BETWEEN $2 AND $3
       ORDER BY date, start_time`,
      [id, start, end]
    );

    // Get reader's existing sessions
    const sessionsQuery = await pool.query(
      `SELECT id, start_time, end_time, status
       FROM sessions
       WHERE reader_id = $1 
         AND start_time <= $3 
         AND end_time >= $2
         AND status IN ('scheduled', 'confirmed')
       ORDER BY start_time`,
      [id, start, end]
    );

    // Process the data to determine availability
    const availability = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Get recurring schedule for this day of week
      const daySchedule = scheduleQuery.rows.filter(
        s => s.day_of_week === dayOfWeek && s.is_available
      );
      
      // Get any blocked dates for this specific date
      const blockedDates = blockedDatesQuery.rows.filter(
        b => new Date(b.date).toDateString() === currentDate.toDateString()
      );
      
      // Get any availability overrides for this date
      const overrides = overridesQuery.rows.filter(
        o => new Date(o.date).toDateString() === currentDate.toDateString()
      );
      
      // Get existing sessions for this date
      const sessions = sessionsQuery.rows.filter(
        s => new Date(s.start_time).toDateString() === currentDate.toDateString()
      );
      
      // Process time slots for this day
      const timeSlots = [];
      
      if (daySchedule.length > 0) {
        // For each time slot in the recurring schedule
        for (const slot of daySchedule) {
          // Check if this slot is blocked
          const isBlocked = blockedDates.some(blocked => {
            if (blocked.is_all_day) return true;
            return (
              (blocked.start_time <= slot.start_time && blocked.end_time > slot.start_time) ||
              (blocked.start_time < slot.end_time && blocked.end_time >= slot.end_time) ||
              (blocked.start_time >= slot.start_time && blocked.end_time <= slot.end_time)
            );
          });
          
          // Check for any overrides for this time slot
          const override = overrides.find(ov => {
            return (
              (ov.start_time <= slot.start_time && ov.end_time > slot.start_time) ||
              (ov.start_time < slot.end_time && ov.end_time >= slot.end_time) ||
              (ov.start_time >= slot.start_time && ov.end_time <= slot.end_time)
            );
          });
          
          // Determine if the slot is available
          const isAvailable = override ? override.is_available : !isBlocked;
          
          // Check for existing sessions in this slot
          const slotSessions = sessions.filter(session => {
            const sessionStart = new Date(session.start_time);
            const sessionEnd = new Date(session.end_time);
            return (
              (sessionStart >= new Date(`${dateStr}T${slot.start_time}`) && 
               sessionStart < new Date(`${dateStr}T${slot.end_time}`)) ||
              (sessionEnd > new Date(`${dateStr}T${slot.start_time}`) && 
               sessionEnd <= new Date(`${dateStr}T${slot.end_time}`)) ||
              (sessionStart <= new Date(`${dateStr}T${slot.start_time}`) && 
               sessionEnd >= new Date(`${dateStr}T${slot.end_time}`))
            );
          });
          
          // Add the time slot to the results
          timeSlots.push({
            startTime: slot.start_time,
            endTime: slot.end_time,
            isAvailable,
            isBlocked,
            overrideReason: override?.reason || null,
            blockedReason: blockedDates.find(b => b.reason)?.reason || null,
            hasExistingSessions: slotSessions.length > 0,
            existingSessions: slotSessions.map(s => ({
              id: s.id,
              startTime: s.start_time,
              endTime: s.end_time,
              status: s.status
            }))
          });
        }
      }
      
      // Add the day's availability to the results
      if (timeSlots.length > 0) {
        availability.push({
          date: dateStr,
          dayOfWeek,
          timeSlots
        });
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: {
        readerId: id,
        timezone: readerTimezone,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        availability
      }
    });
  } catch (error) {
    console.error('Get reader availability error:', error);
    next(error);
  }
};
