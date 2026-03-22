import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { getRecentTrainingLog } from "@/lib/db";
import { resolveOpenAIKey, trackPublicUsage } from "@/lib/openai";

function ruleFallback(themes: string[]) {
  const fallbackSuggestions: Record<string, string> = {
    Footwork: "Net Play",
    "Net Play": "Smash Power",
    "Smash Power": "Defense Drills",
    "Defense Drills": "Doubles Strategy",
    "Doubles Strategy": "Footwork",
  };
  const lastTheme = themes[0];
  const suggestion = fallbackSuggestions[lastTheme] || "Footwork Fundamentals";
  return {
    suggestion,
    reasoning: `Based on your recent focus on ${themes.join(", ")}, we suggest working on ${suggestion} to build a well-rounded game.`,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recentSessions = await getRecentTrainingLog(user.id, 3);

  if (recentSessions.length < 3) {
    return NextResponse.json({
      suggestion: null,
      message: "Need at least 3 sessions for suggestions",
    });
  }

  const keyResult = await resolveOpenAIKey(user);
  if ("error" in keyResult) {
    // No key available — use rule-based fallback (don't error on suggestions)
    const themes = recentSessions.map((s) => s.theme);
    return NextResponse.json(ruleFallback(themes));
  }

  const openai = new OpenAI({ apiKey: keyResult.apiKey });

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

    // Strip markdown code fences if present
    const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : content.trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        suggestion: content.trim(),
        reasoning: "AI-generated suggestion",
      });
    }

    await trackPublicUsage(user.id, keyResult.isPublic);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    // On OpenAI errors, fall back to rule-based suggestion
    const themes = recentSessions.map((s) => s.theme);
    const uniqueThemes = [...new Set(themes)];
    const allThemes = ["Footwork", "Net Play", "Smash Power", "Defense Drills", "Doubles Strategy", "Serve Accuracy"];
    const unused = allThemes.find((t) => !uniqueThemes.includes(t)) || "Footwork Fundamentals";
    const errorMsg = error instanceof Error ? error.message : "";

    return NextResponse.json({
      suggestion: unused,
      reasoning: `Suggested based on your recent themes: ${themes.join(", ")}. (AI unavailable: ${errorMsg})`,
    });
  }
}
