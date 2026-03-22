import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser, getUserPasswordHash, setUserPassword } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { openaiApiKey, locale, currentPassword, newPassword } = body;

  // Handle password change
  if (newPassword !== undefined) {
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
    }
    const existingHash = await getUserPasswordHash(user.id);
    if (existingHash) {
      if (!currentPassword || !verifyPassword(currentPassword, existingHash)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }
    await setUserPassword(user.id, newPassword);
    return NextResponse.json({ user, passwordUpdated: true });
  }

  const updates: Record<string, string | null> = {};
  if (openaiApiKey !== undefined) updates.openaiApiKey = openaiApiKey;
  if (locale !== undefined) updates.locale = locale;

  const updated = await updateUser(user.id, updates);

  const response = NextResponse.json({ user: updated });

  if (locale) {
    response.cookies.set("bb_locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
