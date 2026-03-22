import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { resolveOpenAIKey, trackPublicUsage, handleOpenAIError } from "@/lib/openai";

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return text.trim();
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyResult = await resolveOpenAIKey(user);
  if ("error" in keyResult) {
    return NextResponse.json(
      { error: keyResult.error },
      { status: keyResult.status }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { text } = body;

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return NextResponse.json(
      { error: "Please enter a description of your training program (at least a few sentences)." },
      { status: 400 }
    );
  }

  const prompt = `You are a BWF (Badminton World Federation) certified Level 1 Coach. Convert the following free-text description into a structured training program.

User's description:
"""
${text}
"""

COACHING FRAMEWORK (BWF Coach Education):
Each level should represent a structured 1-hour training session for children aged 10–15, following this session structure:
1. Warm-up (10 min) — Physical activation + footwork patterns related to the theme
2. Technical Focus (15 min) — Isolated skill practice with feeding, shadow work, or wall drills
3. Pressure Drill (15 min) — Semi-open or open drill introducing decision-making and pressure
4. Match Play / Conditioned Game (15 min) — Modified game reinforcing the session's theme
5. Cool Down & Review (5 min) — Stretching + verbal review of key coaching points

DRILL FORMAT — Every drill MUST include:
- Setup: Number of players, court positioning, equipment, feeder vs worker roles
- Instructions: Step-by-step actions, shot patterns, movement, scoring method
- Coaching Point: 1–2 key technical or tactical cues

Interpret the user's intent and create a well-structured training program. If they mention specific drills or levels, use those. If the description is vague, fill in reasonable details following the BWF framework above.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Program Title",
  "theme": "Main training theme",
  "intensity": "low" | "medium" | "high" | "extreme",
  "levels": [
    {
      "level": 1,
      "title": "Level Title",
      "description": "Level description and coaching objectives",
      "exercises": [
        {
          "name": "Exercise name",
          "description": "Setup: ... Instructions: ... Coaching Point: ...",
          "duration": "15 minutes",
          "reps": "10 per side",
          "tips": "Key coaching point"
        }
      ]
    }
  ]
}`;

  let openai: OpenAI;
  try {
    openai = new OpenAI({ apiKey: keyResult.apiKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid API key format";
    return NextResponse.json({ error: `OpenAI setup failed: ${message}` }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a BWF (Badminton World Federation) certified Level 1 Coach specializing in junior development (ages 10-15). Convert free-text training descriptions into structured programs following the BWF Coach Education framework: Warm-up → Technical Focus → Pressure Drill → Match Play/Conditioned Game → Cool Down & Review. Every drill must use the format: Setup → Instructions → Coaching Point. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "The AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    const jsonStr = extractJson(content);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "The AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    await trackPublicUsage(user.id, keyResult.isPublic);

    return NextResponse.json({ program: parsed });
  } catch (error: unknown) {
    const mapped = handleOpenAIError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
