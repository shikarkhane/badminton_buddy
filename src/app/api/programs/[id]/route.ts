import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProgram, updateProgram, deleteProgram, isOrgMember } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const program = await getProgram(id);
  if (!program) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Allow access if user owns the program or is a member of the shared org
  const isOwner = program.userId === user.id;
  const isMember = program.sharedWithOrg
    ? await isOrgMember(program.sharedWithOrg, user.id)
    : false;

  if (!isOwner && !isMember) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ program });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const program = await getProgram(id);
  if (!program || program.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await updateProgram(id, body);
  return NextResponse.json({ program: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const program = await getProgram(id);
  if (!program || program.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteProgram(id);
  return NextResponse.json({ ok: true });
}
