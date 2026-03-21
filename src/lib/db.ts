import { User, TrainingProgram, TrainingLogEntry } from "./types";

// In-memory database
const users: Map<string, User> = new Map();
const programs: Map<string, TrainingProgram> = new Map();
const trainingLog: Map<string, TrainingLogEntry> = new Map();

// Users
export function getUser(id: string): User | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}

export function createUser(user: User): User {
  users.set(user.id, user);
  return user;
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const user = users.get(id);
  if (!user) return undefined;
  const updated = { ...user, ...updates };
  users.set(id, updated);
  return updated;
}

// Programs
export function getProgram(id: string): TrainingProgram | undefined {
  return programs.get(id);
}

export function getUserPrograms(userId: string): TrainingProgram[] {
  const result: TrainingProgram[] = [];
  for (const program of programs.values()) {
    if (program.userId === userId) result.push(program);
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function searchPrograms(userId: string, query: string): TrainingProgram[] {
  const q = query.toLowerCase();
  return getUserPrograms(userId).filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.theme.toLowerCase().includes(q) ||
      p.intensity.toLowerCase().includes(q)
  );
}

export function createProgram(program: TrainingProgram): TrainingProgram {
  programs.set(program.id, program);
  return program;
}

export function updateProgram(
  id: string,
  updates: Partial<TrainingProgram>
): TrainingProgram | undefined {
  const program = programs.get(id);
  if (!program) return undefined;
  const updated = { ...program, ...updates, updatedAt: new Date().toISOString() };
  programs.set(id, updated);
  return updated;
}

export function deleteProgram(id: string): boolean {
  return programs.delete(id);
}

// Training Log
export function getUserTrainingLog(userId: string): TrainingLogEntry[] {
  const result: TrainingLogEntry[] = [];
  for (const entry of trainingLog.values()) {
    if (entry.userId === userId) result.push(entry);
  }
  return result.sort((a, b) => b.date.localeCompare(a.date));
}

export function getRecentTrainingLog(userId: string, count: number): TrainingLogEntry[] {
  return getUserTrainingLog(userId).slice(0, count);
}

export function createTrainingLogEntry(entry: TrainingLogEntry): TrainingLogEntry {
  trainingLog.set(entry.id, entry);
  return entry;
}

export function deleteTrainingLogEntry(id: string): boolean {
  return trainingLog.delete(id);
}
