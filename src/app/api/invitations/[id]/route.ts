import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { getInvitation, updateInvitationStatus, addOrgMember } from "@/lib/db";

// PUT /api/invitations/:id — accept or decline
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invitation = await getInvitation(id);
  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user.email || invitation.email !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "This invitation is not for your account" }, { status: 403 });
  }

  const { action } = await request.json();
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Action must be 'accept' or 'decline'" }, { status: 400 });
  }

  if (action === "accept") {
    await addOrgMember({
      id: uuidv4(),
      orgId: invitation.orgId,
      userId: user.id,
      role: "member",
      joinedAt: new Date().toISOString(),
    });
    await updateInvitationStatus(id, "accepted");
  } else {
    await updateInvitationStatus(id, "declined");
  }

  return NextResponse.json({ success: true });
}
