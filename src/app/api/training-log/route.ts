import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { getUserTrainingLog, createTrainingLogEntry, deleteTrainingLogEntry } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = await getUserTrainingLog(user.id);
  return NextResponse.json({ log });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const entry = await createTrainingLogEntry({
    id: uuidv4(),
    userId: user.id,
    programId: body.programId,
    programTitle: body.programTitle,
    theme: body.theme,
    levelUsed: body.levelUsed,
    notes: body.notes || "",
    date: body.date || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  await deleteTrainingLogEntry(id);
  return NextResponse.json({ ok: true });
}
