import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { isOrgMember, getThread, createPost, getThreadPosts } from "@/lib/db";

// GET posts for a thread
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; threadId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, threadId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const thread = await getThread(threadId);
  if (!thread || thread.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = await getThreadPosts(threadId);
  return NextResponse.json({ posts });
}

// POST a reply (content already moderated by client calling /api/community/moderate first)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; threadId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, threadId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const thread = await getThread(threadId);
  if (!thread || thread.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { content } = await request.json();
  if (!content || typeof content !== "string" || content.trim().length < 1) {
    return NextResponse.json({ error: "Post content is required" }, { status: 400 });
  }

  const post = await createPost({
    id: uuidv4(),
    threadId,
    authorId: user.id,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ post: { ...post, authorName: user.name } }, { status: 201 });
}
