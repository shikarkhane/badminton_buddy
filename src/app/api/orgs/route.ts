import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { createOrganization, getUserOrganizations, addOrgMember } from "@/lib/db";

// GET /api/orgs — list user's organizations
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await getUserOrganizations(user.id);
  return NextResponse.json({ orgs });
}

// POST /api/orgs — create organization
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isGuest) {
    return NextResponse.json({ error: "Guests cannot create organizations. Please sign in first." }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const org = await createOrganization({
    id: uuidv4(),
    name: name.trim(),
    ownerId: user.id,
    createdAt: now,
  });

  // Add creator as owner member
  await addOrgMember({
    id: uuidv4(),
    orgId: org.id,
    userId: user.id,
    role: "owner",
    joinedAt: now,
  });

  return NextResponse.json({ org }, { status: 201 });
}
