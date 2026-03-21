import { NextResponse } from "next/server";
import { getCurrentUser, getSessionCookieName } from "@/lib/auth";
import { createUser, getUser } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    // Check if there's a session cookie — the user may exist but the
    // in-memory DB was cleared (server restart). Re-create as guest
    // so the session stays alive.
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(getSessionCookieName())?.value;
    if (sessionId && !getUser(sessionId)) {
      const restored = createUser({
        id: sessionId,
        email: null,
        name: "Guest",
        isGuest: true,
        openaiApiKey: null,
        locale: "en",
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ user: restored });
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
