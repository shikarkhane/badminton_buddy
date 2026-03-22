import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { resolveOpenAIKey, trackPublicUsage, handleOpenAIError } from "@/lib/openai";

function extractJson(text: string): string {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
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
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { theme, intensity, levelCount } = body;

  if (!theme) {
    return NextResponse.json(
      { error: "Please enter a training theme" },
      { status: 400 }
    );
  }

  const prompt = `Create a badminton training program with the following specifications:
- Theme: ${theme}
- Intensity: ${intensity}
- Number of progression levels: ${levelCount}

For each level, provide:
1. A title (e.g., "Beginner Foundations")
2. A brief description of the level's focus
3. 3-5 exercises/drills, each with:
   - name: A clear drill name
   - description: IMPORTANT — write this as a practical drill setup and gameplay instruction:
     * First, explain the SETUP: how many players, where they stand, what equipment is needed, court positioning
     * Then, explain the DRILL FLOW: what each player does, the sequence of shots/movements, how points are scored or how the drill cycles
     * Include variations or progressions within the drill where appropriate
     * Do NOT just describe what the ideal position or technique "looks like" — instead describe what players actually DO step by step
   - duration: Time (e.g., "15 minutes", "3 sets of 5 minutes")
   - reps: Number of reps if applicable (optional)
   - tips: 1-2 key coaching tips for common mistakes

Example of a GOOD drill description:
"Setup: Player A stands at the net (forehand side), Player B at the baseline (center). Place 3 shuttles on Player B's side. Drill: Player B feeds a high clear to Player A's backhand corner. Player A moves to the corner, plays a drop shot crosscourt, then recovers to center net. Player B picks up the drop and feeds another clear. Repeat 10 times, then switch roles. Progression: Add a third player who intercepts weak drops."

Example of a BAD drill description (do NOT write like this):
"The player should be in a low stance with knees bent and racket up, ready to intercept at the net."

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Program Title",
  "levels": [
    {
      "level": 1,
      "title": "Level Title",
      "description": "Level description",
      "exercises": [
        {
          "name": "Exercise name",
          "description": "Setup: ... Drill: ... Progression: ...",
          "duration": "15 minutes",
          "reps": "10 per side",
          "tips": "Key coaching tip"
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
            "You are a professional badminton coach creating actionable training programs. Every drill must describe the concrete setup (players, positions, equipment) and the gameplay flow (who does what, shot sequences, scoring). Never describe static positions or ideal form — always describe what players actively do. Respond with valid JSON only, no markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
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

    // Track usage for public key calls
    await trackPublicUsage(user.id, keyResult.isPublic);

    return NextResponse.json({ program: parsed });
  } catch (error: unknown) {
    const mapped = handleOpenAIError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
