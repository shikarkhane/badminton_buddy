import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrganization, getOrgMembers, removeOrgMember, isOrgMember } from "@/lib/db";

// GET /api/orgs/:orgId/members
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const members = await getOrgMembers(orgId);
  return NextResponse.json({ members });
}

// DELETE /api/orgs/:orgId/members — remove a member
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const org = await getOrganization(orgId);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { userId } = await request.json();

  // Owner can remove anyone; members can only remove themselves
  if (org.ownerId !== user.id && userId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  // Cannot remove the owner
  if (userId === org.ownerId) {
    return NextResponse.json({ error: "Cannot remove the organization owner" }, { status: 400 });
  }

  await removeOrgMember(orgId, userId);
  return NextResponse.json({ success: true });
}
