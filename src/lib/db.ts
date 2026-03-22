import pool, { initSchema } from "./pg";
import { User, TrainingProgram, TrainingLogEntry, Organization, OrgMember, OrgInvitation, CommunityThread, CommunityPost, ThreadCategory } from "./types";
import { encrypt, decrypt, hashPassword } from "./crypto";

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

export async function createUser(user: User, password?: string): Promise<User> {
  await ready();
  const pwHash = password ? hashPassword(password) : null;
  await pool.query(
    `INSERT INTO users (id, email, name, is_guest, openai_api_key, locale, created_at, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      user.id,
      user.email,
      user.name,
      user.isGuest,
      user.openaiApiKey ? encrypt(user.openaiApiKey) : null,
      user.locale,
      user.createdAt,
      pwHash,
    ]
  );
  return user;
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  await ready();
  const pwHash = hashPassword(password);
  await pool.query("UPDATE users SET password_hash = $2 WHERE id = $1", [id, pwHash]);
}

export async function getUserPasswordHash(id: string): Promise<string | null> {
  await ready();
  const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [id]);
  return rows[0]?.password_hash || null;
}

export async function getUserPasswordHashByEmail(email: string): Promise<{ id: string; passwordHash: string | null } | null> {
  await ready();
  const { rows } = await pool.query("SELECT id, password_hash FROM users WHERE email = $1", [email]);
  if (!rows[0]) return null;
  return { id: rows[0].id, passwordHash: rows[0].password_hash };
}

export async function countUserProgramsToday(userId: string): Promise<number> {
  await ready();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM programs WHERE user_id = $1 AND created_at > $2",
    [userId, cutoff]
  );
  return rows[0]?.count ?? 0;
}

export async function getAllUsers(): Promise<User[]> {
  await ready();
  const { rows } = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(rowToUser);
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
    `INSERT INTO programs (id, user_id, title, theme, intensity, levels, is_custom, is_ai_generated, shared_with_org, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      program.id,
      program.userId,
      program.title,
      program.theme,
      program.intensity,
      JSON.stringify(program.levels),
      program.isCustom,
      program.isAIGenerated,
      program.sharedWithOrg || null,
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
     is_custom=$6, is_ai_generated=$7, shared_with_org=$8, updated_at=$9
     WHERE id=$1`,
    [
      id,
      merged.title,
      merged.theme,
      merged.intensity,
      JSON.stringify(merged.levels),
      merged.isCustom,
      merged.isAIGenerated,
      merged.sharedWithOrg || null,
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

// Organizations
export async function createOrganization(org: Organization): Promise<Organization> {
  await ready();
  await pool.query(
    `INSERT INTO organizations (id, name, owner_id, created_at) VALUES ($1, $2, $3, $4)`,
    [org.id, org.name, org.ownerId, org.createdAt]
  );
  return org;
}

export async function getOrganization(id: string): Promise<Organization | undefined> {
  await ready();
  const { rows } = await pool.query("SELECT * FROM organizations WHERE id = $1", [id]);
  return rows[0] ? rowToOrg(rows[0]) : undefined;
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  await ready();
  const { rows } = await pool.query(
    `SELECT o.* FROM organizations o
     JOIN org_members m ON m.org_id = o.id
     WHERE m.user_id = $1
     ORDER BY o.name`,
    [userId]
  );
  return rows.map(rowToOrg);
}

export async function updateOrganization(id: string, name: string): Promise<Organization | undefined> {
  await ready();
  const { rows } = await pool.query(
    `UPDATE organizations SET name=$2 WHERE id=$1 RETURNING *`,
    [id, name]
  );
  return rows[0] ? rowToOrg(rows[0]) : undefined;
}

export async function deleteOrganization(id: string): Promise<boolean> {
  await ready();
  const result = await pool.query("DELETE FROM organizations WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// Org Members
export async function addOrgMember(member: OrgMember): Promise<OrgMember> {
  await ready();
  await pool.query(
    `INSERT INTO org_members (id, org_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (org_id, user_id) DO NOTHING`,
    [member.id, member.orgId, member.userId, member.role, member.joinedAt]
  );
  return member;
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  await ready();
  const { rows } = await pool.query(
    `SELECT m.*, u.name as user_name, u.email as user_email
     FROM org_members m JOIN users u ON u.id = m.user_id
     WHERE m.org_id = $1 ORDER BY m.joined_at`,
    [orgId]
  );
  return rows.map(rowToOrgMember);
}

export async function removeOrgMember(orgId: string, userId: string): Promise<boolean> {
  await ready();
  const result = await pool.query(
    "DELETE FROM org_members WHERE org_id = $1 AND user_id = $2",
    [orgId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function isOrgMember(orgId: string, userId: string): Promise<boolean> {
  await ready();
  const { rows } = await pool.query(
    "SELECT 1 FROM org_members WHERE org_id = $1 AND user_id = $2",
    [orgId, userId]
  );
  return rows.length > 0;
}

// Org Invitations
export async function createInvitation(invitation: OrgInvitation): Promise<OrgInvitation> {
  await ready();
  await pool.query(
    `INSERT INTO org_invitations (id, org_id, email, invited_by, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (org_id, email) DO UPDATE SET status='pending', created_at=$6`,
    [invitation.id, invitation.orgId, invitation.email, invitation.invitedBy, invitation.status, invitation.createdAt]
  );
  return invitation;
}

export async function getPendingInvitationCount(email: string): Promise<number> {
  await ready();
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM org_invitations WHERE email = $1 AND status = 'pending'",
    [email]
  );
  return rows[0]?.count ?? 0;
}

export async function getPendingInvitations(email: string): Promise<OrgInvitation[]> {
  await ready();
  const { rows } = await pool.query(
    `SELECT i.*, o.name as org_name FROM org_invitations i
     JOIN organizations o ON o.id = i.org_id
     WHERE i.email = $1 AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    [email]
  );
  return rows.map(rowToInvitation);
}

export async function getOrgInvitations(orgId: string): Promise<OrgInvitation[]> {
  await ready();
  const { rows } = await pool.query(
    `SELECT i.*, o.name as org_name FROM org_invitations i
     JOIN organizations o ON o.id = i.org_id
     WHERE i.org_id = $1 ORDER BY i.created_at DESC`,
    [orgId]
  );
  return rows.map(rowToInvitation);
}

export async function updateInvitationStatus(id: string, status: string): Promise<OrgInvitation | undefined> {
  await ready();
  const { rows } = await pool.query(
    `UPDATE org_invitations SET status=$2 WHERE id=$1 RETURNING *`,
    [id, status]
  );
  return rows[0] ? rowToInvitation(rows[0]) : undefined;
}

export async function getInvitation(id: string): Promise<OrgInvitation | undefined> {
  await ready();
  const { rows } = await pool.query(
    `SELECT i.*, o.name as org_name FROM org_invitations i
     JOIN organizations o ON o.id = i.org_id WHERE i.id = $1`,
    [id]
  );
  return rows[0] ? rowToInvitation(rows[0]) : undefined;
}

export async function deleteInvitation(id: string): Promise<boolean> {
  await ready();
  const result = await pool.query("DELETE FROM org_invitations WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// Shared programs — programs shared with an org that the user is a member of
export async function getOrgSharedPrograms(orgId: string): Promise<TrainingProgram[]> {
  await ready();
  const { rows } = await pool.query(
    `SELECT * FROM programs WHERE shared_with_org = $1 ORDER BY created_at DESC`,
    [orgId]
  );
  return rows.map(rowToProgram);
}

// Community Threads
export async function createThread(thread: CommunityThread): Promise<CommunityThread> {
  await ready();
  await pool.query(
    `INSERT INTO community_threads (id, org_id, category, title, author_id, pinned, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [thread.id, thread.orgId, thread.category, thread.title, thread.authorId, thread.pinned, thread.createdAt, thread.updatedAt]
  );
  return thread;
}

export async function getOrgThreads(orgId: string, category?: ThreadCategory): Promise<CommunityThread[]> {
  await ready();
  const query = category
    ? `SELECT t.*, u.name as author_name,
         (SELECT COUNT(*) FROM community_posts p WHERE p.thread_id = t.id) as post_count
       FROM community_threads t JOIN users u ON u.id = t.author_id
       WHERE t.org_id = $1 AND t.category = $2
       ORDER BY t.pinned DESC, t.updated_at DESC`
    : `SELECT t.*, u.name as author_name,
         (SELECT COUNT(*) FROM community_posts p WHERE p.thread_id = t.id) as post_count
       FROM community_threads t JOIN users u ON u.id = t.author_id
       WHERE t.org_id = $1
       ORDER BY t.pinned DESC, t.updated_at DESC`;
  const params = category ? [orgId, category] : [orgId];
  const { rows } = await pool.query(query, params);
  return rows.map(rowToThread);
}

export async function getThread(id: string): Promise<CommunityThread | undefined> {
  await ready();
  const { rows } = await pool.query(
    `SELECT t.*, u.name as author_name,
       (SELECT COUNT(*) FROM community_posts p WHERE p.thread_id = t.id) as post_count
     FROM community_threads t JOIN users u ON u.id = t.author_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] ? rowToThread(rows[0]) : undefined;
}

export async function deleteThread(id: string): Promise<boolean> {
  await ready();
  const result = await pool.query("DELETE FROM community_threads WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// Community Posts
export async function createPost(post: CommunityPost): Promise<CommunityPost> {
  await ready();
  await pool.query(
    `INSERT INTO community_posts (id, thread_id, author_id, content, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [post.id, post.threadId, post.authorId, post.content, post.createdAt]
  );
  // Update thread's updated_at
  await pool.query(
    `UPDATE community_threads SET updated_at = $2 WHERE id = $1`,
    [post.threadId, post.createdAt]
  );
  return post;
}

export async function getThreadPosts(threadId: string): Promise<CommunityPost[]> {
  await ready();
  const { rows } = await pool.query(
    `SELECT p.*, u.name as author_name
     FROM community_posts p JOIN users u ON u.id = p.author_id
     WHERE p.thread_id = $1
     ORDER BY p.created_at ASC`,
    [threadId]
  );
  return rows.map(rowToPost);
}

export async function deletePost(id: string): Promise<boolean> {
  await ready();
  const result = await pool.query("DELETE FROM community_posts WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// AI usage tracking (for public credits rate limiting)
export async function countRecentAiUsage(userId: string, hours: number = 24): Promise<number> {
  await ready();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM ai_usage WHERE user_id = $1 AND used_at > $2",
    [userId, cutoff]
  );
  return rows[0]?.count ?? 0;
}

export async function recordAiUsage(userId: string): Promise<void> {
  await ready();
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO ai_usage (id, user_id, used_at) VALUES ($1, $2, $3)",
    [id, userId, new Date().toISOString()]
  );
}

// Login events
export async function recordLoginEvent(userId: string): Promise<void> {
  await ready();
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO login_events (id, user_id, logged_in_at) VALUES ($1, $2, $3)",
    [id, userId, new Date().toISOString()]
  );
}

export async function getAdminUserStats(): Promise<Array<{
  id: string;
  email: string | null;
  name: string;
  isGuest: boolean;
  createdAt: string;
  lastLogin: string | null;
  programCount: number;
  sharedProgramCount: number;
  loginCountLast7Days: number;
}>> {
  await ready();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { rows } = await pool.query(`
    SELECT
      u.id, u.email, u.name, u.is_guest, u.created_at,
      (SELECT MAX(logged_in_at) FROM login_events le WHERE le.user_id = u.id) as last_login,
      (SELECT COUNT(*)::int FROM programs p WHERE p.user_id = u.id) as program_count,
      (SELECT COUNT(*)::int FROM programs p WHERE p.user_id = u.id AND p.shared_with_org IS NOT NULL) as shared_program_count,
      (SELECT COUNT(*)::int FROM login_events le WHERE le.user_id = u.id AND le.logged_in_at > $1) as login_count_7d
    FROM users u
    ORDER BY u.created_at DESC
  `, [cutoff7d]);

  return rows.map(row => ({
    id: row.id as string,
    email: row.email as string | null,
    name: row.name as string,
    isGuest: row.is_guest as boolean,
    createdAt: row.created_at as string,
    lastLogin: row.last_login as string | null,
    programCount: row.program_count as number,
    sharedProgramCount: row.shared_program_count as number,
    loginCountLast7Days: row.login_count_7d as number,
  }));
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
    sharedWithOrg: (row.shared_with_org as string | null) || null,
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

function rowToOrg(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    ownerId: row.owner_id as string,
    createdAt: row.created_at as string,
  };
}

function rowToOrgMember(row: Record<string, unknown>): OrgMember {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    userId: row.user_id as string,
    role: row.role as OrgMember["role"],
    joinedAt: row.joined_at as string,
    userName: row.user_name as string | undefined,
    userEmail: row.user_email as string | null | undefined,
  };
}

function rowToInvitation(row: Record<string, unknown>): OrgInvitation {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    email: row.email as string,
    invitedBy: row.invited_by as string,
    status: row.status as OrgInvitation["status"],
    createdAt: row.created_at as string,
    orgName: row.org_name as string | undefined,
  };
}

function rowToThread(row: Record<string, unknown>): CommunityThread {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    category: row.category as ThreadCategory,
    title: row.title as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string | undefined,
    pinned: row.pinned as boolean,
    postCount: Number(row.post_count || 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPost(row: Record<string, unknown>): CommunityPost {
  return {
    id: row.id as string,
    threadId: row.thread_id as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string | undefined,
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}
