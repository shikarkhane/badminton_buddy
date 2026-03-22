import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { isOrgMember, createThread, getOrgThreads, createPost } from "@/lib/db";
import { ThreadCategory } from "@/lib/types";

const VALID_CATEGORIES: ThreadCategory[] = ["general", "feedback", "ideas"];

// GET /api/orgs/:orgId/community?category=general
export async function GET(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const category = request.nextUrl.searchParams.get("category") as ThreadCategory | null;
  const threads = await getOrgThreads(orgId, category && VALID_CATEGORIES.includes(category) ? category : undefined);
  return NextResponse.json({ threads });
}

// POST /api/orgs/:orgId/community — create thread with first post
export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { title, category, content } = await request.json();

  if (!title || typeof title !== "string" || title.trim().length < 1) {
    return NextResponse.json({ error: "Thread title is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length < 1) {
    return NextResponse.json({ error: "First post content is required" }, { status: 400 });
  }
  const cat: ThreadCategory = VALID_CATEGORIES.includes(category) ? category : "general";

  const now = new Date().toISOString();
  const thread = await createThread({
    id: uuidv4(),
    orgId,
    category: cat,
    title: title.trim(),
    authorId: user.id,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  });

  // Create the first post
  const post = await createPost({
    id: uuidv4(),
    threadId: thread.id,
    authorId: user.id,
    content: content.trim(),
    createdAt: now,
  });

  return NextResponse.json({ thread: { ...thread, authorName: user.name }, post }, { status: 201 });
}
