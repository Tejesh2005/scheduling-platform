const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID;

// GET all availability schedules with their slots
router.get('/', async (req, res, next) => {
  try {
    const schedules = await db.query(
      `SELECT * FROM availability_schedules 
       WHERE user_id = \$1 
       ORDER BY is_default DESC, created_at ASC`,
      [DEFAULT_USER_ID]
    );

    // Get slots for each schedule
    const schedulesWithSlots = await Promise.all(
      schedules.rows.map(async (schedule) => {
        const slots = await db.query(
          `SELECT * FROM availability_slots 
           WHERE schedule_id = \$1 
           ORDER BY day_of_week ASC`,
          [schedule.id]
        );

        const overrides = await db.query(
          `SELECT * FROM date_overrides 
           WHERE schedule_id = \$1 
           ORDER BY override_date ASC`,
          [schedule.id]
        );

        return {
          ...schedule,
          slots: slots.rows,
          overrides: overrides.rows,
        };
      })
    );

    res.json({ success: true, data: schedulesWithSlots });
  } catch (err) {
    next(err);
  }
});

// GET single availability schedule
router.get('/:id', async (req, res, next) => {
  try {
    const schedule = await db.query(
      'SELECT * FROM availability_schedules WHERE id = \$1 AND user_id = \$2',
      [req.params.id, DEFAULT_USER_ID]
    );

    if (schedule.rows.length === 0) {
      throw new AppError('Schedule not found', 404);
    }

    const slots = await db.query(
      'SELECT * FROM availability_slots WHERE schedule_id = \$1 ORDER BY day_of_week ASC',
      [req.params.id]
    );

    const overrides = await db.query(
      'SELECT * FROM date_overrides WHERE schedule_id = \$1 ORDER BY override_date ASC',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...schedule.rows[0],
        slots: slots.rows,
        overrides: overrides.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// CREATE availability schedule
router.post('/', async (req, res, next) => {
  try {
    const { name, timezone } = req.body;

    const result = await db.query(
      `INSERT INTO availability_schedules (user_id, name, timezone, is_default)
       VALUES (\$1, \$2, \$3, false)
       RETURNING *`,
      [DEFAULT_USER_ID, name || 'New Schedule', timezone || 'America/New_York']
    );

    const scheduleId = result.rows[0].id;

    // Create default slots (Mon-Fri, 9-5)
    for (let day = 0; day <= 6; day++) {
      const isEnabled = day >= 1 && day <= 5;
      await db.query(
        `INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time, is_enabled)
         VALUES (\$1, \$2, \$3, \$4, \$5)`,
        [scheduleId, day, '09:00', '17:00', isEnabled]
      );
    }

    // Fetch complete schedule
    const slots = await db.query(
      'SELECT * FROM availability_slots WHERE schedule_id = \$1 ORDER BY day_of_week',
      [scheduleId]
    );

    res.status(201).json({
      success: true,
      data: { ...result.rows[0], slots: slots.rows, overrides: [] },
    });
  } catch (err) {
    next(err);
  }
});

// UPDATE availability schedule and its slots
router.put('/:id', async (req, res, next) => {
  try {
    const { name, timezone, slots } = req.body;

    // Update schedule info
    await db.query(
      `UPDATE availability_schedules 
       SET name = COALESCE(\$1, name), 
           timezone = COALESCE(\$2, timezone),
           updated_at = NOW()
       WHERE id = \$3 AND user_id = \$4`,
      [name, timezone, req.params.id, DEFAULT_USER_ID]
    );

    // Update slots if provided
    if (slots && Array.isArray(slots)) {
      for (const slot of slots) {
        if (slot.id) {
          // Update existing slot
          await db.query(
            `UPDATE availability_slots 
             SET start_time = \$1, end_time = \$2, is_enabled = \$3
             WHERE id = \$4 AND schedule_id = \$5`,
            [slot.start_time, slot.end_time, slot.is_enabled, slot.id, req.params.id]
          );
        } else {
          // Insert new slot
          await db.query(
            `INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time, is_enabled)
             VALUES (\$1, \$2, \$3, \$4, \$5)`,
            [req.params.id, slot.day_of_week, slot.start_time, slot.end_time, slot.is_enabled]
          );
        }
      }
    }

    // Return updated schedule
    const schedule = await db.query(
      'SELECT * FROM availability_schedules WHERE id = \$1',
      [req.params.id]
    );

    const updatedSlots = await db.query(
      'SELECT * FROM availability_slots WHERE schedule_id = \$1 ORDER BY day_of_week',
      [req.params.id]
    );

    const overrides = await db.query(
      'SELECT * FROM date_overrides WHERE schedule_id = \$1 ORDER BY override_date',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...schedule.rows[0],
        slots: updatedSlots.rows,
        overrides: overrides.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ADD date override
router.post('/:id/overrides', async (req, res, next) => {
  try {
    const { override_date, start_time, end_time, is_available } = req.body;

    if (!override_date) {
      throw new AppError('Override date is required', 400);
    }

    const result = await db.query(
      `INSERT INTO date_overrides (schedule_id, override_date, start_time, end_time, is_available)
       VALUES (\$1, \$2, \$3, \$4, \$5)
       ON CONFLICT (schedule_id, override_date) 
       DO UPDATE SET start_time = \$3, end_time = \$4, is_available = \$5
       RETURNING *`,
      [req.params.id, override_date, start_time || null, end_time || null, is_available || false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE date override
router.delete('/:id/overrides/:overrideId', async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM date_overrides WHERE id = \$1 AND schedule_id = \$2',
      [req.params.overrideId, req.params.id]
    );
    res.json({ success: true, message: 'Override deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;