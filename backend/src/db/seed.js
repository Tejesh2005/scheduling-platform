const { Pool } = require('pg');
require('dotenv').config();

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID;

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Create Default User
    await pool.query(`
      INSERT INTO users (id, name, email, username, timezone, avatar_url)
      VALUES (\$1, 'John Doe', 'john@example.com', 'johndoe', 'America/New_York', NULL)
      ON CONFLICT (id) DO NOTHING
    `, [DEFAULT_USER_ID]);
    console.log('✅ Default user created');

    // 2. Create Event Types
    const eventTypes = [
      {
        title: '15 Minute Meeting',
        slug: '15min',
        description: 'A quick 15-minute call to discuss brief topics.',
        duration: 15,
        location: 'Google Meet',
        color: '#4F46E5',
      },
      {
        title: '30 Minute Meeting',
        slug: '30min',
        description: 'A standard 30-minute meeting for general discussions.',
        duration: 30,
        location: 'Google Meet',
        color: '#0EA5E9',
      },
      {
        title: '60 Minute Consultation',
        slug: '60min',
        description: 'An in-depth 60-minute consultation session.',
        duration: 60,
        location: 'Zoom',
        color: '#E11D48',
      },
    ];

    const eventTypeIds = [];

    for (const et of eventTypes) {
      const result = await pool.query(`
        INSERT INTO event_types (user_id, title, slug, description, duration, location, color, is_active)
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, true)
        RETURNING id
      `, [DEFAULT_USER_ID, et.title, et.slug, et.description, et.duration, et.location, et.color]);
      eventTypeIds.push(result.rows[0].id);
    }
    console.log('✅ Event types created');

    // 3. Create Default Availability Schedule
    const scheduleResult = await pool.query(`
      INSERT INTO availability_schedules (user_id, name, timezone, is_default)
      VALUES (\$1, 'Working Hours', 'America/New_York', true)
      RETURNING id
    `, [DEFAULT_USER_ID]);

    const scheduleId = scheduleResult.rows[0].id;

    const days = [
      { day: 0, enabled: false },
      { day: 1, enabled: true },
      { day: 2, enabled: true },
      { day: 3, enabled: true },
      { day: 4, enabled: true },
      { day: 5, enabled: true },
      { day: 6, enabled: false },
    ];

    for (const d of days) {
      await pool.query(`
        INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time, is_enabled)
        VALUES (\$1, \$2, \$3, \$4, \$5)
      `, [scheduleId, d.day, '09:00', '17:00', d.enabled]);
    }
    console.log('✅ Availability schedule created');

    // 4. Create Sample Bookings
    const now = new Date();

    const makeDate = (daysFromNow, hour, minute = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysFromNow);
      date.setHours(hour, minute, 0, 0);
      return date;
    };

    const bookings = [
      {
        event_type_id: eventTypeIds[1],
        booker_name: 'Alice Johnson',
        booker_email: 'alice@example.com',
        start_time: makeDate(1, 10, 0),
        end_time: makeDate(1, 10, 30),
        status: 'confirmed',
        notes: 'Discuss project timeline',
      },
      {
        event_type_id: eventTypeIds[2],
        booker_name: 'Bob Williams',
        booker_email: 'bob@example.com',
        start_time: makeDate(1, 14, 0),
        end_time: makeDate(1, 15, 0),
        status: 'confirmed',
        notes: 'Technical consultation',
      },
      {
        event_type_id: eventTypeIds[0],
        booker_name: 'Carol Davis',
        booker_email: 'carol@example.com',
        start_time: makeDate(3, 11, 0),
        end_time: makeDate(3, 11, 15),
        status: 'confirmed',
        notes: null,
      },
      {
        event_type_id: eventTypeIds[1],
        booker_name: 'David Brown',
        booker_email: 'david@example.com',
        start_time: makeDate(5, 9, 0),
        end_time: makeDate(5, 9, 30),
        status: 'confirmed',
        notes: 'Follow-up meeting',
      },
      {
        event_type_id: eventTypeIds[1],
        booker_name: 'Eve Martinez',
        booker_email: 'eve@example.com',
        start_time: makeDate(-2, 10, 0),
        end_time: makeDate(-2, 10, 30),
        status: 'completed',
        notes: 'Initial discussion',
      },
      {
        event_type_id: eventTypeIds[2],
        booker_name: 'Frank Wilson',
        booker_email: 'frank@example.com',
        start_time: makeDate(2, 15, 0),
        end_time: makeDate(2, 16, 0),
        status: 'cancelled',
        notes: 'Was going to discuss roadmap',
      },
    ];

    for (const b of bookings) {
      await pool.query(`
        INSERT INTO bookings (event_type_id, user_id, booker_name, booker_email, start_time, end_time, status, notes)
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8)
      `, [b.event_type_id, DEFAULT_USER_ID, b.booker_name, b.booker_email, b.start_time, b.end_time, b.status, b.notes]);
    }
    console.log('✅ Sample bookings created');

    console.log('\n🎉 Database seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

seed();