import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOrgMember, getThread, deleteThread, getOrganization } from "@/lib/db";

// GET thread detail
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

  return NextResponse.json({ thread });
}

// DELETE thread (author or org owner only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; threadId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, threadId } = await params;
  const thread = await getThread(threadId);
  if (!thread || thread.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const org = await getOrganization(orgId);
  if (thread.authorId !== user.id && org?.ownerId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await deleteThread(threadId);
  return NextResponse.json({ success: true });
}
