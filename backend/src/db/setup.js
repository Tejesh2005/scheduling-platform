const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  const rootPool = new Pool({
    connectionString: process.env.DATABASE_URL.replace('/scheduling_platform', '/postgres'),
  });

  try {
    const dbCheck = await rootPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'scheduling_platform'"
    );

    if (dbCheck.rows.length === 0) {
      await rootPool.query('CREATE DATABASE scheduling_platform');
      console.log('✅ Database "scheduling_platform" created');
    } else {
      console.log('ℹ️  Database "scheduling_platform" already exists');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await rootPool.end();
  }

  const appPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    await appPool.query(schemaSQL);
    console.log('✅ Database schema created successfully');
  } catch (err) {
    console.error('❌ Error creating schema:', err.message);
  } finally {
    await appPool.end();
  }
}

setup();