import { User, TrainingProgram, TrainingLogEntry } from "./types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export async function loginGuest(): Promise<{ user: User }> {
  return fetchJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ type: "guest" }),
  });
}

export async function loginGoogle(
  email: string,
  name: string
): Promise<{ user: User }> {
  return fetchJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ type: "google", email, name }),
  });
}

export async function logout(): Promise<void> {
  await fetchJson("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{ user: User | null }> {
  try {
    return await fetchJson("/api/auth/me");
  } catch {
    return { user: null };
  }
}

export async function updateSettings(settings: {
  openaiApiKey?: string;
  locale?: string;
}): Promise<{ user: User }> {
  return fetchJson("/api/auth/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// Programs
export async function getPrograms(
  query?: string
): Promise<{ programs: TrainingProgram[] }> {
  const url = query
    ? `/api/programs?q=${encodeURIComponent(query)}`
    : "/api/programs";
  return fetchJson(url);
}

export async function getProgram(
  id: string
): Promise<{ program: TrainingProgram }> {
  return fetchJson(`/api/programs/${id}`);
}

export async function createProgram(
  data: Partial<TrainingProgram>
): Promise<{ program: TrainingProgram }> {
  return fetchJson("/api/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProgramApi(
  id: string,
  data: Partial<TrainingProgram>
): Promise<{ program: TrainingProgram }> {
  return fetchJson(`/api/programs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProgramApi(id: string): Promise<void> {
  await fetchJson(`/api/programs/${id}`, { method: "DELETE" });
}

export async function generateProgram(data: {
  theme: string;
  intensity: string;
  levelCount: number;
}): Promise<{
  program: { title: string; levels: TrainingProgram["levels"] };
}> {
  return fetchJson("/api/programs/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Training Log
export async function getTrainingLog(): Promise<{ log: TrainingLogEntry[] }> {
  return fetchJson("/api/training-log");
}

export async function logTrainingSession(data: {
  programId: string;
  programTitle: string;
  theme: string;
  levelUsed: number;
  notes: string;
  date: string;
}): Promise<{ entry: TrainingLogEntry }> {
  return fetchJson("/api/training-log", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Suggestions
export async function getSuggestion(): Promise<{
  suggestion: string | null;
  reasoning?: string;
  message?: string;
}> {
  return fetchJson("/api/suggestions");
}
