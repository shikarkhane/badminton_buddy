import { User, TrainingProgram, TrainingLogEntry, Organization, OrgMember, OrgInvitation, CommunityThread, CommunityPost, ThreadCategory } from "./types";

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
  password: string,
  name: string
): Promise<{ user: User }> {
  return fetchJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ type: "google", email, password, name }),
  });
}

export async function logout(): Promise<void> {
  await fetchJson("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{ user: User | null; publicCreditsRemaining?: number | null }> {
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

export async function parseCustomProgram(text: string): Promise<{
  program: {
    title: string;
    theme: string;
    intensity: string;
    levels: TrainingProgram["levels"];
  };
}> {
  return fetchJson("/api/programs/parse", {
    method: "POST",
    body: JSON.stringify({ text }),
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

// Organizations
export async function getOrgs(): Promise<{ orgs: Organization[] }> {
  return fetchJson("/api/orgs");
}

export async function createOrg(name: string): Promise<{ org: Organization }> {
  return fetchJson("/api/orgs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getOrg(orgId: string): Promise<{ org: Organization }> {
  return fetchJson(`/api/orgs/${orgId}`);
}

export async function updateOrg(orgId: string, name: string): Promise<{ org: Organization }> {
  return fetchJson(`/api/orgs/${orgId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteOrg(orgId: string): Promise<void> {
  await fetchJson(`/api/orgs/${orgId}`, { method: "DELETE" });
}

export async function getOrgMembers(orgId: string): Promise<{ members: OrgMember[] }> {
  return fetchJson(`/api/orgs/${orgId}/members`);
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  await fetchJson(`/api/orgs/${orgId}/members`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export async function inviteToOrg(orgId: string, email: string): Promise<{ invitation: OrgInvitation }> {
  return fetchJson(`/api/orgs/${orgId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getOrgInvitations(orgId: string): Promise<{ invitations: OrgInvitation[] }> {
  return fetchJson(`/api/orgs/${orgId}/invitations`);
}

export async function cancelInvitation(orgId: string, invitationId: string): Promise<void> {
  await fetchJson(`/api/orgs/${orgId}/invitations`, {
    method: "DELETE",
    body: JSON.stringify({ invitationId }),
  });
}

export async function getMyInvitations(): Promise<{ invitations: OrgInvitation[] }> {
  return fetchJson("/api/invitations");
}

export async function respondToInvitation(id: string, action: "accept" | "decline"): Promise<void> {
  await fetchJson(`/api/invitations/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action }),
  });
}

export async function getOrgPrograms(orgId: string): Promise<{ programs: TrainingProgram[] }> {
  return fetchJson(`/api/orgs/${orgId}/programs`);
}

// Community
export async function moderateContent(content: string): Promise<{ approved: boolean; reason?: string }> {
  return fetchJson("/api/community/moderate", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getOrgThreads(orgId: string, category?: ThreadCategory): Promise<{ threads: CommunityThread[] }> {
  const url = category
    ? `/api/orgs/${orgId}/community?category=${category}`
    : `/api/orgs/${orgId}/community`;
  return fetchJson(url);
}

export async function createThread(orgId: string, data: { title: string; category: ThreadCategory; content: string }): Promise<{ thread: CommunityThread; post: CommunityPost }> {
  return fetchJson(`/api/orgs/${orgId}/community`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getThreadDetail(orgId: string, threadId: string): Promise<{ thread: CommunityThread }> {
  return fetchJson(`/api/orgs/${orgId}/community/threads/${threadId}`);
}

export async function deleteThread(orgId: string, threadId: string): Promise<void> {
  await fetchJson(`/api/orgs/${orgId}/community/threads/${threadId}`, { method: "DELETE" });
}

export async function getThreadPosts(orgId: string, threadId: string): Promise<{ posts: CommunityPost[] }> {
  return fetchJson(`/api/orgs/${orgId}/community/threads/${threadId}/posts`);
}

export async function createPostReply(orgId: string, threadId: string, content: string): Promise<{ post: CommunityPost }> {
  return fetchJson(`/api/orgs/${orgId}/community/threads/${threadId}/posts`, {
    method: "POST",
    body: JSON.stringify({ content }),
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
