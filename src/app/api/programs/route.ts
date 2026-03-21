import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { getUserPrograms, searchPrograms, createProgram } from "@/lib/db";
import { TrainingProgram } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  const programs = query
    ? searchPrograms(user.id, query)
    : getUserPrograms(user.id);

  return NextResponse.json({ programs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    createdAt: now,
    updatedAt: now,
  };

  createProgram(program);
  return NextResponse.json({ program }, { status: 201 });
}
