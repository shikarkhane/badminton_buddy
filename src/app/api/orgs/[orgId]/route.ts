import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrganization, updateOrganization, deleteOrganization, isOrgMember } from "@/lib/db";

// GET /api/orgs/:orgId
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const org = await getOrganization(orgId);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ org });
}

// PUT /api/orgs/:orgId — rename
export async function PUT(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const org = await getOrganization(orgId);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can rename the organization" }, { status: 403 });
  }

  const { name } = await request.json();
  const updated = await updateOrganization(orgId, name);
  return NextResponse.json({ org: updated });
}

// DELETE /api/orgs/:orgId
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const org = await getOrganization(orgId);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can delete the organization" }, { status: 403 });
  }

  await deleteOrganization(orgId);
  return NextResponse.json({ success: true });
}
