import { NextResponse } from "next/server";
import { getCurrentUser, getSessionCookieName } from "@/lib/auth";
import { createUser, getUser } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(getSessionCookieName())?.value;
    if (sessionId && !(await getUser(sessionId))) {
      const restored = await createUser({
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
