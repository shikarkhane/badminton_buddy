import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSession, updateSession, deleteSession, isOrgMember } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check access: owner or org member
  if (session.orgId) {
    if (!(await isOrgMember(session.orgId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await updateSession(id, {
    name: body.name,
    dayOfWeek: body.dayOfWeek,
    startTime: body.startTime,
    programId: body.programId,
    recurrenceRule: body.recurrenceRule,
  });

  return NextResponse.json({ session: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.orgId) {
    if (!(await isOrgMember(session.orgId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteSession(id);
  return NextResponse.json({ ok: true });
}
