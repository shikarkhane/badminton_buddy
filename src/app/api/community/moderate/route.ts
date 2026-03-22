import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ approved: false, reason: "Content is required" });
  }

  return NextResponse.json(basicCheck(content));
}

function basicCheck(content: string): { approved: boolean; reason?: string } {
  if (!content || content.trim().length < 1) {
    return { approved: false, reason: "Content cannot be empty" };
  }
  if (content.length > 5000) {
    return { approved: false, reason: "Content is too long (max 5000 characters)" };
  }

  const blocked = [
    "fuck", "shit", "ass hole", "bitch", "damn", "crap",
    "dick", "bastard", "slut", "whore", "retard", "faggot",
    "nigger", "nigga", "cunt",
  ];
  const lower = content.toLowerCase();
  for (const word of blocked) {
    if (lower.includes(word)) {
      return { approved: false, reason: "Your message contains inappropriate language. Please keep it respectful." };
    }
  }

  return { approved: true };
}
