const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { generateTimeSlots } = require('../utils/timeSlots');

// GET event type info by username and slug
router.get('/:username/:slug', async (req, res, next) => {
  try {
    const { username, slug } = req.params;

    const result = await db.query(
      `SELECT et.*, u.name as user_name, u.username, u.timezone as user_timezone
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE u.username = \$1 AND et.slug = \$2 AND et.is_active = true`,
      [username, slug]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET available time slots for a specific date
router.get('/:username/:slug/slots', async (req, res, next) => {
  try {
    const { username, slug } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new AppError('Date is required (YYYY-MM-DD)', 400);
    }

    // Get event type
    const eventResult = await db.query(
      `SELECT et.*, u.id as uid
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE u.username = \$1 AND et.slug = \$2 AND et.is_active = true`,
      [username, slug]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    const eventType = eventResult.rows[0];

    // Get default availability schedule
    const scheduleResult = await db.query(
      `SELECT * FROM availability_schedules 
       WHERE user_id = \$1 AND is_default = true
       LIMIT 1`,
      [eventType.uid]
    );

    if (scheduleResult.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const schedule = scheduleResult.rows[0];

    // Check for date override
    const overrideResult = await db.query(
      `SELECT * FROM date_overrides 
       WHERE schedule_id = \$1 AND override_date = \$2`,
      [schedule.id, date]
    );

    let availableSlots = [];

    if (overrideResult.rows.length > 0) {
      const override = overrideResult.rows[0];
      if (!override.is_available) {
        return res.json({ success: true, data: [] });
      }
      availableSlots = generateTimeSlots(
        override.start_time,
        override.end_time,
        eventType.duration,
        eventType.buffer_after
      );
    } else {
      // Get day of week for the requested date
      const requestedDate = new Date(date + 'T00:00:00');
      const dayOfWeek = requestedDate.getDay();

      // Get availability slot for this day
      const slotResult = await db.query(
        `SELECT * FROM availability_slots 
         WHERE schedule_id = \$1 AND day_of_week = \$2 AND is_enabled = true`,
        [schedule.id, dayOfWeek]
      );

      if (slotResult.rows.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Generate time slots for each availability window
      for (const slot of slotResult.rows) {
        const startStr = slot.start_time.substring(0, 5);
        const endStr = slot.end_time.substring(0, 5);
        const slots = generateTimeSlots(
          startStr,
          endStr,
          eventType.duration,
          eventType.buffer_after
        );
        availableSlots.push(...slots);
      }
    }

    // Remove already booked slots
    const bookingsResult = await db.query(
      `SELECT start_time, end_time FROM bookings 
       WHERE event_type_id = \$1 
         AND status = 'confirmed'
         AND DATE(start_time) = \$2`,
      [eventType.id, date]
    );

    const bookedTimes = bookingsResult.rows.map((b) => {
      const start = new Date(b.start_time);
      return `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    });

    // Filter out booked slots
    availableSlots = availableSlots.filter(
      (slot) => !bookedTimes.includes(slot.start)
    );

    // Filter out past time slots if the date is today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (date === todayStr) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes() + (eventType.min_booking_notice || 60);
      availableSlots = availableSlots.filter((slot) => {
        const [h, m] = slot.start.split(':').map(Number);
        return h * 60 + m > nowMinutes;
      });
    }

    res.json({ success: true, data: availableSlots });
  } catch (err) {
    next(err);
  }
});

// CREATE a booking (public)
router.post('/:username/:slug/book', async (req, res, next) => {
  try {
    const { username, slug } = req.params;
    const { booker_name, booker_email, start_time, end_time, notes } = req.body;

    // Validate
    if (!booker_name || !booker_email || !start_time || !end_time) {
      throw new AppError('Name, email, start time, and end time are required', 400);
    }

    // Get event type
    const eventResult = await db.query(
      `SELECT et.*, u.id as uid
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE u.username = \$1 AND et.slug = \$2 AND et.is_active = true`,
      [username, slug]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    const eventType = eventResult.rows[0];

    // Check for double booking
    const conflict = await db.query(
      `SELECT id FROM bookings 
       WHERE user_id = \$1 
         AND status = 'confirmed'
         AND (start_time, end_time) OVERLAPS (\$2::timestamptz, \$3::timestamptz)`,
      [eventType.uid, start_time, end_time]
    );

    if (conflict.rows.length > 0) {
      throw new AppError('This time slot is no longer available', 409);
    }

    // Create booking
    const result = await db.query(
      `INSERT INTO bookings (event_type_id, user_id, booker_name, booker_email, start_time, end_time, notes, status)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, 'confirmed')
       RETURNING *`,
      [eventType.id, eventType.uid, booker_name, booker_email, start_time, end_time, notes || null]
    );

    // Return booking with event type details
    const booking = result.rows[0];
    booking.event_title = eventType.title;
    booking.event_duration = eventType.duration;
    booking.event_location = eventType.location;
    booking.host_name = eventResult.rows[0].user_name || 'John Doe';

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

module.exports = router;