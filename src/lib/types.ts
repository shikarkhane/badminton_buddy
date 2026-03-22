export interface User {
  id: string;
  email: string | null;
  name: string;
  isGuest: boolean;
  openaiApiKey: string | null;
  locale: string;
  createdAt: string;
}

export interface TrainingExercise {
  name: string;
  description: string;
  duration: string;
  reps?: string;
  tips: string;
}

export interface TrainingLevel {
  level: number;
  title: string;
  description: string;
  exercises: TrainingExercise[];
}

export interface TrainingProgram {
  id: string;
  userId: string;
  title: string;
  theme: string;
  intensity: "low" | "medium" | "high" | "extreme";
  levels: TrainingLevel[];
  isCustom: boolean;
  isAIGenerated: boolean;
  sharedWithOrg: string | null;
  authorName?: string;
  orgName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLogEntry {
  id: string;
  userId: string;
  programId: string;
  programTitle: string;
  theme: string;
  levelUsed: number;
  notes: string;
  date: string;
  sessionId?: string | null;
  sessionName?: string | null;
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  orgId: string | null;
  userId: string;
  name: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "HH:MM"
  programId: string | null;
  programTitle?: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  userName?: string;
  userEmail?: string | null;
}

export interface OrgInvitation {
  id: string;
  orgId: string;
  email: string;
  invitedBy: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  orgName?: string;
}

export type ThreadCategory = "general" | "feedback" | "ideas";

export interface CommunityThread {
  id: string;
  orgId: string;
  category: ThreadCategory;
  title: string;
  authorId: string;
  authorName?: string;
  pinned: boolean;
  postCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
}
