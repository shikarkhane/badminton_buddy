import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { getOrganization, isOrgMember, createInvitation, getOrgInvitations, deleteInvitation } from "@/lib/db";

// GET /api/orgs/:orgId/invitations
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const invitations = await getOrgInvitations(orgId);
  return NextResponse.json({ invitations });
}

// POST /api/orgs/:orgId/invitations — invite by email
export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const org = await getOrganization(orgId);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const invitation = await createInvitation({
    id: uuidv4(),
    orgId,
    email: email.trim().toLowerCase(),
    invitedBy: user.id,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ invitation }, { status: 201 });
}

// DELETE /api/orgs/:orgId/invitations — cancel an invitation
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { invitationId } = await request.json();
  await deleteInvitation(invitationId);
  return NextResponse.json({ success: true });
}
