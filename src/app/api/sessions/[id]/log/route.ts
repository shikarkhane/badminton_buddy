import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSession, getSessionLogHistory, isOrgMember } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check access
  if (session.orgId) {
    if (!(await isOrgMember(session.orgId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const log = await getSessionLogHistory(id);
  return NextResponse.json({ log, session });
}
