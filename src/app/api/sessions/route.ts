import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { getUserSessions, createSession } from "@/lib/db";

// GET /api/sessions — user's personal sessions
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await getUserSessions(user.id);
  return NextResponse.json({ sessions });
}

// POST /api/sessions — create personal session
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, dayOfWeek, startTime, programId, recurrenceRule } = body;

  if (!name || dayOfWeek === undefined) {
    return NextResponse.json({ error: "Name and day of week are required" }, { status: 400 });
  }

  const session = await createSession({
    id: uuidv4(),
    orgId: null,
    userId: user.id,
    name,
    dayOfWeek: Number(dayOfWeek),
    startTime: startTime || "18:00",
    programId: programId || null,
    recurrenceRule: recurrenceRule || null,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ session }, { status: 201 });
}
