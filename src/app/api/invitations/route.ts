import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPendingInvitations } from "@/lib/db";

// GET /api/invitations — get current user's pending invitations
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.email) {
    return NextResponse.json({ invitations: [] });
  }

  const invitations = await getPendingInvitations(user.email);
  return NextResponse.json({ invitations });
}
