import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = path.join(__dirname, '../uploads');

export async function ensureSchema() {
  fs.mkdirSync(uploadsDir, { recursive: true });

  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_accounts JSONB DEFAULT '{}'::jsonb`);
  await query(`
    CREATE TABLE IF NOT EXISTS records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(80) NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_records_user_type ON records(user_id, entity_type)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_records_data ON records USING GIN (data)`);
}
