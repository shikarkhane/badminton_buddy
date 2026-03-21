import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { openaiApiKey, locale } = body;

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
