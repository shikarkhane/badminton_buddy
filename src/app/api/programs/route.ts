import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { getUserPrograms, searchPrograms, createProgram, countUserProgramsToday } from "@/lib/db";
import { TrainingProgram } from "@/lib/types";

const DAILY_PROGRAM_LIMIT = 5;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  const programs = query
    ? await searchPrograms(user.id, query)
    : await getUserPrograms(user.id);

  return NextResponse.json({ programs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 programs per day
  const todayCount = await countUserProgramsToday(user.id);
  if (todayCount >= DAILY_PROGRAM_LIMIT) {
    return NextResponse.json(
      { error: `You can create up to ${DAILY_PROGRAM_LIMIT} programs per day. Please try again tomorrow.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const program: TrainingProgram = {
    id: uuidv4(),
    userId: user.id,
    title: body.title,
    theme: body.theme,
    intensity: body.intensity,
    levels: body.levels,
    isCustom: body.isCustom || false,
    isAIGenerated: body.isAIGenerated || false,
    sharedWithOrg: body.sharedWithOrg || null,
    createdAt: now,
    updatedAt: now,
  };

  await createProgram(program);
  return NextResponse.json({ program }, { status: 201 });
}
