import { Pool } from "pg";

// Neon + Vercel integration may use a prefixed name like SHUTTLE_LAB_DATABASE_URL
// or POSTGRES_URL. Fall back to individual PG* vars, then local dev default.
function resolveConnectionString(): string {
  // Check for full connection string under common names
  for (const key of Object.keys(process.env)) {
    if (key === "DATABASE_URL" || key === "POSTGRES_URL" || key.endsWith("_DATABASE_URL")) {
      if (process.env[key]) return process.env[key]!;
    }
  }

  // Build from individual Neon/Vercel PG* vars (possibly prefixed)
  const pgKeys = Object.keys(process.env);
  const host = pgKeys.find((k) => k.endsWith("PGHOST"));
  const db = pgKeys.find((k) => k.endsWith("PGDATABASE"));
  const user = pgKeys.find((k) => k.endsWith("PGUSER"));
  const pass = pgKeys.find((k) => k.endsWith("PGPASSWORD"));
  if (host && db && user && pass) {
    return `postgresql://${process.env[user]}:${process.env[pass]}@${process.env[host]}/${process.env[db]}?sslmode=require`;
  }

  return "postgresql://bbuser:bbpass@localhost:5432/badminton_buddy";
}

const connectionString = resolveConnectionString();

// Neon and most managed Postgres providers require SSL
const isExternal = !connectionString.includes("localhost");

const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 5000,
  ssl: isExternal ? { rejectUnauthorized: false } : false,
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

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      UNIQUE(org_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS org_invitations (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      UNIQUE(org_id, email)
    );

    ALTER TABLE programs ADD COLUMN IF NOT EXISTS shared_with_org TEXT DEFAULT NULL;

    CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
    CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON org_invitations(email);
    CREATE INDEX IF NOT EXISTS idx_programs_shared ON programs(shared_with_org);

    CREATE TABLE IF NOT EXISTS community_threads (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'general',
      title TEXT NOT NULL,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pinned BOOLEAN NOT NULL DEFAULT false,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_threads_org ON community_threads(org_id);
    CREATE INDEX IF NOT EXISTS idx_threads_category ON community_threads(org_id, category);
    CREATE INDEX IF NOT EXISTS idx_posts_thread ON community_posts(thread_id);
  `);

  schemaInitialized = true;
}
