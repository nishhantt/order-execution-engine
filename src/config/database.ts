import { Pool } from 'pg';

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');

// ALWAYS use DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://orderengine:dev_password_123@localhost:5432/order_execution';

console.log('🔌 Connecting to Database');

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err.message);
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Database connected');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to database:', err);
    throw err;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await pool.end();
};