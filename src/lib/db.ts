import pool, { initSchema } from "./pg";
import { User, TrainingProgram, TrainingLogEntry } from "./types";
import { encrypt, decrypt } from "./crypto";

// Initialize schema on first import
const schemaReady = initSchema();

async function ready() {
  await schemaReady;
}

// Users
export async function getUser(id: string): Promise<User | undefined> {
  await ready();
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function getUserByEmail(
  email: string
): Promise<User | undefined> {
  await ready();
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function createUser(user: User): Promise<User> {
  await ready();
  await pool.query(
    `INSERT INTO users (id, email, name, is_guest, openai_api_key, locale, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      user.id,
      user.email,
      user.name,
      user.isGuest,
      user.openaiApiKey ? encrypt(user.openaiApiKey) : null,
      user.locale,
      user.createdAt,
    ]
  );
  return user;
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User | undefined> {
  await ready();
  const existing = await getUser(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...updates };
  await pool.query(
    `UPDATE users SET email=$2, name=$3, is_guest=$4, openai_api_key=$5, locale=$6
     WHERE id=$1`,
    [
      id,
      merged.email,
      merged.name,
      merged.isGuest,
      merged.openaiApiKey ? encrypt(merged.openaiApiKey) : null,
      merged.locale,
    ]
  );
  return merged;
}

// Programs
export async function getProgram(
  id: string
): Promise<TrainingProgram | undefined> {
  await ready();
  const { rows } = await pool.query("SELECT * FROM programs WHERE id = $1", [
    id,
  ]);
  return rows[0] ? rowToProgram(rows[0]) : undefined;
}

export async function getUserPrograms(
  userId: string
): Promise<TrainingProgram[]> {
  await ready();
  const { rows } = await pool.query(
    "SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows.map(rowToProgram);
}

export async function searchPrograms(
  userId: string,
  query: string
): Promise<TrainingProgram[]> {
  await ready();
  const q = `%${query.toLowerCase()}%`;
  const { rows } = await pool.query(
    `SELECT * FROM programs WHERE user_id = $1
     AND (LOWER(title) LIKE $2 OR LOWER(theme) LIKE $2 OR LOWER(intensity) LIKE $2)
     ORDER BY created_at DESC`,
    [userId, q]
  );
  return rows.map(rowToProgram);
}

export async function createProgram(
  program: TrainingProgram
): Promise<TrainingProgram> {
  await ready();
  await pool.query(
    `INSERT INTO programs (id, user_id, title, theme, intensity, levels, is_custom, is_ai_generated, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      program.id,
      program.userId,
      program.title,
      program.theme,
      program.intensity,
      JSON.stringify(program.levels),
      program.isCustom,
      program.isAIGenerated,
      program.createdAt,
      program.updatedAt,
    ]
  );
  return program;
}

export async function updateProgram(
  id: string,
  updates: Partial<TrainingProgram>
): Promise<TrainingProgram | undefined> {
  await ready();
  const existing = await getProgram(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await pool.query(
    `UPDATE programs SET title=$2, theme=$3, intensity=$4, levels=$5,
     is_custom=$6, is_ai_generated=$7, updated_at=$8
     WHERE id=$1`,
    [
      id,
      merged.title,
      merged.theme,
      merged.intensity,
      JSON.stringify(merged.levels),
      merged.isCustom,
      merged.isAIGenerated,
      merged.updatedAt,
    ]
  );
  return merged;
}

export async function deleteProgram(id: string): Promise<boolean> {
  await ready();
  const result = await pool.query("DELETE FROM programs WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// Training Log
export async function getUserTrainingLog(
  userId: string
): Promise<TrainingLogEntry[]> {
  await ready();
  const { rows } = await pool.query(
    "SELECT * FROM training_log WHERE user_id = $1 ORDER BY date DESC",
    [userId]
  );
  return rows.map(rowToLogEntry);
}

export async function getRecentTrainingLog(
  userId: string,
  count: number
): Promise<TrainingLogEntry[]> {
  await ready();
  const { rows } = await pool.query(
    "SELECT * FROM training_log WHERE user_id = $1 ORDER BY date DESC LIMIT $2",
    [userId, count]
  );
  return rows.map(rowToLogEntry);
}

export async function createTrainingLogEntry(
  entry: TrainingLogEntry
): Promise<TrainingLogEntry> {
  await ready();
  await pool.query(
    `INSERT INTO training_log (id, user_id, program_id, program_title, theme, level_used, notes, date, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      entry.id,
      entry.userId,
      entry.programId,
      entry.programTitle,
      entry.theme,
      entry.levelUsed,
      entry.notes,
      entry.date,
      entry.createdAt,
    ]
  );
  return entry;
}

export async function deleteTrainingLogEntry(id: string): Promise<boolean> {
  await ready();
  const result = await pool.query("DELETE FROM training_log WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

// Row mappers
function decryptApiKey(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    return decrypt(raw);
  } catch {
    // Legacy plaintext key — return as-is so existing users aren't broken
    return raw;
  }
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string | null,
    name: row.name as string,
    isGuest: row.is_guest as boolean,
    openaiApiKey: decryptApiKey(row.openai_api_key),
    locale: row.locale as string,
    createdAt: row.created_at as string,
  };
}

function rowToProgram(row: Record<string, unknown>): TrainingProgram {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    theme: row.theme as string,
    intensity: row.intensity as TrainingProgram["intensity"],
    levels:
      typeof row.levels === "string"
        ? JSON.parse(row.levels)
        : (row.levels as TrainingProgram["levels"]),
    isCustom: row.is_custom as boolean,
    isAIGenerated: row.is_ai_generated as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToLogEntry(row: Record<string, unknown>): TrainingLogEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    programId: row.program_id as string,
    programTitle: row.program_title as string,
    theme: row.theme as string,
    levelUsed: row.level_used as number,
    notes: row.notes as string,
    date: row.date as string,
    createdAt: row.created_at as string,
  };
}
