import { pool } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    console.log('📄 Schema file loaded');
    
    await pool.query(schema);
    
    console.log('✅ Database migrated successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();