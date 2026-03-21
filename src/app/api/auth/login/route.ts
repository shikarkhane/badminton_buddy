import { NextRequest, NextResponse } from "next/server";
import { loginWithGoogle, createGuestUser, getSessionCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, email, name } = body;

  let user;
  if (type === "google" && email) {
    user = await loginWithGoogle(email, name || email.split("@")[0]);
  } else {
    user = await createGuestUser();
  }

  const response = NextResponse.json({ user });
  response.cookies.set(getSessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
