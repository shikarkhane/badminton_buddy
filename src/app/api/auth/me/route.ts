import { NextResponse } from "next/server";
import { getCurrentUser, getSessionCookieName } from "@/lib/auth";
import { createUser, getUser, getPendingInvitationCount } from "@/lib/db";
import { getRemainingCredits } from "@/lib/openai";
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
      const hasPublicKey = !!process.env.OPENAI_API_KEY;
      const credits = hasPublicKey ? await getRemainingCredits(restored.id) : 0;
      return NextResponse.json({ user: restored, publicCreditsRemaining: hasPublicKey ? credits : null, pendingInvitations: 0 });
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const hasPublicKey = !!process.env.OPENAI_API_KEY;
  const credits = hasPublicKey && !user.openaiApiKey ? await getRemainingCredits(user.id) : null;
  const pendingInvitations = user.email ? await getPendingInvitationCount(user.email) : 0;
  return NextResponse.json({ user, publicCreditsRemaining: credits, pendingInvitations });
}
