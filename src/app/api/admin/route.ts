import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserByEmail, createUser, updateUser, getAllUsers, setUserPassword } from "@/lib/db";

function isAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const auth = request.headers.get("x-admin-password");
  return auth === adminPassword;
}

// GET /api/admin — list all users
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getAllUsers();
  return NextResponse.json({ users });
}

// POST /api/admin — create or update user
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const existing = await getUserByEmail(email);

  if (existing) {
    // Update existing user
    const updates: Partial<{ name: string; isGuest: boolean }> = {};
    if (name) updates.name = name;
    updates.isGuest = false;
    const updated = await updateUser(existing.id, updates);
    await setUserPassword(existing.id, password);
    return NextResponse.json({ user: updated, action: "updated" });
  }

  // Create new user
  const user = await createUser(
    {
      id: uuidv4(),
      email,
      name: name || email.split("@")[0],
      isGuest: false,
      openaiApiKey: null,
      locale: "en",
      createdAt: new Date().toISOString(),
    },
    password
  );

  return NextResponse.json({ user, action: "created" }, { status: 201 });
}
