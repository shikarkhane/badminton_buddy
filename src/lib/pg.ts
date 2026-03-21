import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://bbuser:bbpass@localhost:5432/badminton_buddy",
  max: 10,
  connectionTimeoutMillis: 5000,
});

export default pool;

let schemaInitialized = false;

export async function initSchema() {
  if (schemaInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT NOT NULL,
      is_guest BOOLEAN NOT NULL DEFAULT false,
      openai_api_key TEXT,
      locale TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      theme TEXT NOT NULL,
      intensity TEXT NOT NULL,
      levels JSONB NOT NULL DEFAULT '[]',
      is_custom BOOLEAN NOT NULL DEFAULT false,
      is_ai_generated BOOLEAN NOT NULL DEFAULT false,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS training_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      program_id TEXT NOT NULL,
      program_title TEXT NOT NULL,
      theme TEXT NOT NULL,
      level_used INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
    CREATE INDEX IF NOT EXISTS idx_training_log_user_id ON training_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  schemaInitialized = true;
}
