import { NextRequest, NextResponse } from "next/server";
import { loginWithEmail, createGuestUser, getSessionCookieName } from "@/lib/auth";
import { recordLoginEvent } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, email, password, name } = body;

  if (type === "google" && email) {
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    const result = await loginWithEmail(email, password, name || email.split("@")[0]);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await recordLoginEvent(result.user.id);

    const response = NextResponse.json({ user: result.user });
    response.cookies.set(getSessionCookieName(), result.user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  // Guest login
  const user = await createGuestUser();
  await recordLoginEvent(user.id);

  const response = NextResponse.json({ user });
  response.cookies.set(getSessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
