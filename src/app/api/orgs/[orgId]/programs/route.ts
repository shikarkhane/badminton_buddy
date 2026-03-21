import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOrgMember, getOrgSharedPrograms } from "@/lib/db";

// GET /api/orgs/:orgId/programs — shared programs
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const programs = await getOrgSharedPrograms(orgId);
  return NextResponse.json({ programs });
}
