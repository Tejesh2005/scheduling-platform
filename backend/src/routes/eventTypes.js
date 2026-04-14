const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID;

// GET all event types
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM event_types 
       WHERE user_id = \$1 
       ORDER BY created_at DESC`,
      [DEFAULT_USER_ID]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET single event type
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM event_types WHERE id = \$1 AND user_id = \$2',
      [req.params.id, DEFAULT_USER_ID]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// CREATE event type
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      slug,
      description,
      duration,
      location,
      color,
      buffer_before,
      buffer_after,
      min_booking_notice,
      max_booking_days,
    } = req.body;

    // Validate required fields
    if (!title || !slug || !duration) {
      throw new AppError('Title, slug, and duration are required', 400);
    }

    // Check if slug already exists
    const slugCheck = await db.query(
      'SELECT id FROM event_types WHERE slug = \$1 AND user_id = \$2',
      [slug, DEFAULT_USER_ID]
    );

    if (slugCheck.rows.length > 0) {
      throw new AppError('An event type with this URL slug already exists', 400);
    }

    const result = await db.query(
      `INSERT INTO event_types 
        (user_id, title, slug, description, duration, location, color, buffer_before, buffer_after, min_booking_notice, max_booking_days)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11)
       RETURNING *`,
      [
        DEFAULT_USER_ID,
        title,
        slug,
        description || null,
        duration,
        location || 'Google Meet',
        color || '#292929',
        buffer_before || 0,
        buffer_after || 0,
        min_booking_notice || 60,
        max_booking_days || 60,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE event type
router.put('/:id', async (req, res, next) => {
  try {
    const {
      title,
      slug,
      description,
      duration,
      location,
      color,
      is_active,
      buffer_before,
      buffer_after,
      min_booking_notice,
      max_booking_days,
    } = req.body;

    // Check if event type exists
    const existing = await db.query(
      'SELECT * FROM event_types WHERE id = \$1 AND user_id = \$2',
      [req.params.id, DEFAULT_USER_ID]
    );

    if (existing.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    // Check slug uniqueness if slug is being changed
    if (slug && slug !== existing.rows[0].slug) {
      const slugCheck = await db.query(
        'SELECT id FROM event_types WHERE slug = \$1 AND user_id = \$2 AND id != \$3',
        [slug, DEFAULT_USER_ID, req.params.id]
      );
      if (slugCheck.rows.length > 0) {
        throw new AppError('An event type with this URL slug already exists', 400);
      }
    }

    const result = await db.query(
      `UPDATE event_types SET
        title = COALESCE(\$1, title),
        slug = COALESCE(\$2, slug),
        description = COALESCE(\$3, description),
        duration = COALESCE(\$4, duration),
        location = COALESCE(\$5, location),
        color = COALESCE(\$6, color),
        is_active = COALESCE(\$7, is_active),
        buffer_before = COALESCE(\$8, buffer_before),
        buffer_after = COALESCE(\$9, buffer_after),
        min_booking_notice = COALESCE(\$10, min_booking_notice),
        max_booking_days = COALESCE(\$11, max_booking_days),
        updated_at = NOW()
       WHERE id = \$12 AND user_id = \$13
       RETURNING *`,
      [
        title,
        slug,
        description,
        duration,
        location,
        color,
        is_active,
        buffer_before,
        buffer_after,
        min_booking_notice,
        max_booking_days,
        req.params.id,
        DEFAULT_USER_ID,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// TOGGLE event type active/inactive
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE event_types 
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = \$1 AND user_id = \$2
       RETURNING *`,
      [req.params.id, DEFAULT_USER_ID]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE event type
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM event_types WHERE id = \$1 AND user_id = \$2 RETURNING *',
      [req.params.id, DEFAULT_USER_ID]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event type not found', 404);
    }

    res.json({ success: true, message: 'Event type deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;