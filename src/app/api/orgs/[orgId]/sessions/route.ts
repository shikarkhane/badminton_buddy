import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { isOrgMember, createSession, getOrgSessions, getOrgSharedPrograms } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const sessions = await getOrgSessions(orgId);
  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  if (!(await isOrgMember(orgId, user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await request.json();
  const { name, dayOfWeek, startTime, programId } = body;

  if (!name || dayOfWeek === undefined) {
    return NextResponse.json({ error: "Name and day of week are required" }, { status: 400 });
  }

  // Validate programId belongs to org shared programs if provided
  if (programId) {
    const sharedProgs = await getOrgSharedPrograms(orgId);
    const userProgs = sharedProgs.filter(p => p.userId === user.id || p.sharedWithOrg === orgId);
    if (!userProgs.find(p => p.id === programId)) {
      // Also allow any program shared with this org
      const allShared = sharedProgs.find(p => p.id === programId);
      if (!allShared) {
        return NextResponse.json({ error: "Program not available in this organization" }, { status: 400 });
      }
    }
  }

  const session = await createSession({
    id: uuidv4(),
    orgId,
    userId: user.id,
    name,
    dayOfWeek: Number(dayOfWeek),
    startTime: startTime || "18:00",
    programId: programId || null,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ session }, { status: 201 });
}
