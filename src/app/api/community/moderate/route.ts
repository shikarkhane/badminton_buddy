import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.openaiApiKey) {
    // If user has no key, skip AI moderation — do basic check only
    const { content } = await request.json();
    const basic = basicCheck(content);
    return NextResponse.json(basic);
  }

  const { content } = await request.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ approved: false, reason: "Content is required" });
  }

  // Basic profanity check first (free, no API call needed)
  const basic = basicCheck(content);
  if (!basic.approved) return NextResponse.json(basic);

  // AI moderation
  try {
    const openai = new OpenAI({ apiKey: user.openaiApiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a community content moderator for a badminton training app. Review the following post and determine if it should be approved.

REJECT if the content contains:
- Profanity, slurs, or offensive language
- Personal attacks, bullying, or harassment
- Spam, advertisements, or irrelevant content
- Hate speech or discrimination
- Explicit or violent content
- Sharing of personal information (phone numbers, addresses)

APPROVE if the content is:
- On-topic (badminton, training, sports, fitness)
- Constructive and respectful
- Questions, tips, feedback, or ideas
- Friendly conversation between teammates

Respond with ONLY valid JSON: {"approved": true} or {"approved": false, "reason": "brief explanation"}`,
        },
        { role: "user", content: `Review this post:\n"${content}"` },
      ],
      temperature: 0,
    });

    const result = completion.choices[0]?.message?.content;
    if (result) {
      try {
        const parsed = JSON.parse(result.replace(/```json?\s*/g, "").replace(/```/g, "").trim());
        return NextResponse.json(parsed);
      } catch {
        // If AI response can't be parsed, approve (fail open)
        return NextResponse.json({ approved: true });
      }
    }

    return NextResponse.json({ approved: true });
  } catch {
    // If AI moderation fails, fall back to basic check result
    return NextResponse.json({ approved: true });
  }
}

function basicCheck(content: string): { approved: boolean; reason?: string } {
  if (!content || content.trim().length < 1) {
    return { approved: false, reason: "Content cannot be empty" };
  }
  if (content.length > 5000) {
    return { approved: false, reason: "Content is too long (max 5000 characters)" };
  }

  // Basic profanity list — catches obvious cases; AI handles nuanced ones
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
