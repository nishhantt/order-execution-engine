import { Pool } from 'pg';
import { config } from './index';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('database');

// Use DATABASE_URL if available (Railway), otherwise use individual config
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: config.database.maxConnections,
    })
  : new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      max: config.database.maxConnections,
    });

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info({ time: result.rows[0].now }, 'Database connected successfully');
    client.release();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    throw err;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await pool.end();
  logger.info('Database connection closed');
};