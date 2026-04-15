// FILE: src/routes/bookings.js

const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { sendBookingCancellation, sendBookingRescheduled } = require('../utils/email');

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID;

// GET all bookings with filters
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = '';
    let params = [DEFAULT_USER_ID];

    if (status === 'upcoming') {
      query = `
        SELECT b.*, et.title as event_title, et.slug as event_slug, et.duration, et.location, et.color
        FROM bookings b
        JOIN event_types et ON b.event_type_id = et.id
        WHERE b.user_id = \$1 
          AND b.status = 'confirmed' 
          AND b.start_time > NOW()
        ORDER BY b.start_time ASC`;
    } else if (status === 'past') {
      query = `
        SELECT b.*, et.title as event_title, et.slug as event_slug, et.duration, et.location, et.color
        FROM bookings b
        JOIN event_types et ON b.event_type_id = et.id
        WHERE b.user_id = \$1 
          AND (b.start_time <= NOW() OR b.status = 'completed')
          AND b.status != 'cancelled'
        ORDER BY b.start_time DESC`;
    } else if (status === 'cancelled') {
      query = `
        SELECT b.*, et.title as event_title, et.slug as event_slug, et.duration, et.location, et.color
        FROM bookings b
        JOIN event_types et ON b.event_type_id = et.id
        WHERE b.user_id = \$1 
          AND b.status = 'cancelled'
        ORDER BY b.start_time DESC`;
    } else {
      query = `
        SELECT b.*, et.title as event_title, et.slug as event_slug, et.duration, et.location, et.color
        FROM bookings b
        JOIN event_types et ON b.event_type_id = et.id
        WHERE b.user_id = \$1
        ORDER BY b.start_time DESC`;
    }

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET single booking
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT b.*, et.title as event_title, et.slug as event_slug, et.duration, et.location, et.color
       FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       WHERE b.id = \$1 AND b.user_id = \$2`,
      [req.params.id, DEFAULT_USER_ID]
    );

    if (result.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// CANCEL a booking
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const { cancellation_reason } = req.body;

    // Get FULL booking details first (before status changes)
    const bookingDetails = await db.query(
      `SELECT b.booker_name, b.booker_email, b.start_time, b.end_time, b.status,
              et.title as event_title, et.location,
              u.name as host_name, u.timezone as user_timezone
       FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = \$1 AND b.user_id = \$2`,
      [req.params.id, DEFAULT_USER_ID]
    );

    if (bookingDetails.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const details = bookingDetails.rows[0];

    if (details.status !== 'confirmed') {
      throw new AppError('Booking is not in confirmed status', 400);
    }

    // Now cancel it
    const result = await db.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           cancellation_reason = \$1,
           updated_at = NOW()
       WHERE id = \$2 AND user_id = \$3
       RETURNING *`,
      [cancellation_reason || null, req.params.id, DEFAULT_USER_ID]
    );

    // Send cancellation email
    console.log('📧 Sending cancellation email to:', details.booker_email);
    
    sendBookingCancellation({
      bookerName: details.booker_name,
      bookerEmail: details.booker_email,
      hostName: details.host_name || 'John Doe',
      eventTitle: details.event_title,
      startTime: details.start_time,
      endTime: details.end_time,
      location: details.location || 'Google Meet',
      timezone: details.user_timezone || 'Asia/Kolkata',
      reason: cancellation_reason || null,
    }).then(() => {
      console.log('✅ Cancellation email sent successfully');
    }).catch(err => {
      console.error('❌ Cancellation email failed:', err.message);
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// RESCHEDULE a booking
router.patch('/:id/reschedule', async (req, res, next) => {
  try {
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      throw new AppError('New start and end time are required', 400);
    }

    // Get FULL booking details first
    const bookingDetails = await db.query(
      `SELECT b.booker_name, b.booker_email, b.start_time, b.end_time,
              et.title as event_title, et.location,
              u.name as host_name, u.timezone as user_timezone
       FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = \$1 AND b.user_id = \$2`,
      [req.params.id, DEFAULT_USER_ID]
    );

    if (bookingDetails.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const details = bookingDetails.rows[0];

    // Check for conflicts
    const conflict = await db.query(
      `SELECT id FROM bookings 
       WHERE user_id = \$1 
         AND status = 'confirmed'
         AND id != \$2
         AND (start_time, end_time) OVERLAPS (\$3::timestamptz, \$4::timestamptz)`,
      [DEFAULT_USER_ID, req.params.id, start_time, end_time]
    );

    if (conflict.rows.length > 0) {
      throw new AppError('This time slot is already booked', 409);
    }

    // Now reschedule it
    const result = await db.query(
      `UPDATE bookings 
       SET start_time = \$1, 
           end_time = \$2, 
           status = 'confirmed',
           updated_at = NOW()
       WHERE id = \$3 AND user_id = \$4
       RETURNING *`,
      [start_time, end_time, req.params.id, DEFAULT_USER_ID]
    );

    // Send reschedule email
    console.log('📧 Sending reschedule email to:', details.booker_email);

    sendBookingRescheduled({
      bookerName: details.booker_name,
      bookerEmail: details.booker_email,
      hostName: details.host_name || 'John Doe',
      eventTitle: details.event_title,
      oldStartTime: details.start_time,
      oldEndTime: details.end_time,
      newStartTime: start_time,
      newEndTime: end_time,
      location: details.location || 'Google Meet',
      timezone: details.user_timezone || 'Asia/Kolkata',
    }).then(() => {
      console.log('✅ Reschedule email sent successfully');
    }).catch(err => {
      console.error('❌ Reschedule email failed:', err.message);
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;