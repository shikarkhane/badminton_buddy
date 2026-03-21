import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { getRecentTrainingLog } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recentSessions = getRecentTrainingLog(user.id, 3);

  if (recentSessions.length < 3) {
    return NextResponse.json({
      suggestion: null,
      message: "Need at least 3 sessions for suggestions",
    });
  }

  if (!user.openaiApiKey) {
    // Fallback suggestion without AI
    const themes = recentSessions.map((s) => s.theme);
    const fallbackSuggestions: Record<string, string> = {
      Footwork: "Net Play",
      "Net Play": "Smash Power",
      "Smash Power": "Defense Drills",
      "Defense Drills": "Doubles Strategy",
      "Doubles Strategy": "Footwork",
    };

    const lastTheme = themes[0];
    const suggestion =
      fallbackSuggestions[lastTheme] || "Footwork Fundamentals";

    return NextResponse.json({
      suggestion,
      reasoning: `Based on your recent focus on ${themes.join(", ")}, we suggest working on ${suggestion} to build a well-rounded game.`,
    });
  }

  const openai = new OpenAI({ apiKey: user.openaiApiKey });

  const sessionSummary = recentSessions
    .map(
      (s, i) =>
        `Session ${i + 1}: Theme="${s.theme}", Program="${s.programTitle}", Level=${s.levelUsed}, Notes="${s.notes}"`
    )
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a badminton coach advisor. Based on recent training sessions, suggest the next training theme. Respond with JSON only: {\"suggestion\": \"theme name\", \"reasoning\": \"brief explanation\"}",
        },
        {
          role: "user",
          content: `Here are my last 3 badminton training sessions:\n${sessionSummary}\n\nWhat should I focus on next?`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to get suggestion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
