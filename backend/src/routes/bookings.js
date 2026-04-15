// FILE: src/routes/bookings.js
// UPDATE all the SELECT queries to also include et.slug

// For example, change every occurrence of:
//   SELECT b.*, et.title as event_title, et.duration, et.location, et.color
// To:
//   SELECT b.*, et.title as event_title, et.slug as event_slug, et.duration, et.location, et.color

// Here's the full updated file:

const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');

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

    const result = await db.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           cancellation_reason = \$1,
           updated_at = NOW()
       WHERE id = \$2 AND user_id = \$3 AND status = 'confirmed'
       RETURNING *`,
      [cancellation_reason || null, req.params.id, DEFAULT_USER_ID]
    );

    if (result.rows.length === 0) {
      throw new AppError('Booking not found or already cancelled', 404);
    }

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

    if (result.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;