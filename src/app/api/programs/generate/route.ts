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

  const prompt = `You are a BWF (Badminton World Federation) certified Level 1 Coach designing a structured training program.

Training Request:
- Theme: ${theme}
- Intensity: ${intensity}
- Number of progression levels: ${levelCount}

COACHING FRAMEWORK (BWF Coach Education):
Each level should represent a structured 1-hour training session designed for children aged 10–15 years, following this session structure:

1. Warm-up (10 minutes) — Physical activation + footwork patterns related to the session theme
2. Technical Focus (15 minutes) — Isolated skill practice with feeding, shadow work, or wall drills
3. Pressure Drill (15 minutes) — Semi-open or open drill that introduces decision-making and pressure
4. Match Play / Conditioned Game (15 minutes) — Modified game with rules that reinforce the session's theme
5. Cool Down & Review (5 minutes) — Stretching + verbal review of key coaching points

DRILL FORMAT — Every drill/exercise MUST include:
- Setup: Number of players, court positioning, equipment needed, feeder vs worker roles
- Instructions: Step-by-step sequence of what each player does, shot patterns, movement, scoring method
- Coaching Point: 1–2 key technical or tactical cues the coach should emphasize

Example of a GOOD drill:
"Setup: Player A at the net (forehand side), Player B at baseline (center). 10 shuttles ready. Instructions: Player B feeds a high clear to Player A's backhand corner. Player A moves using 2-step chassé, plays a straight drop shot, then recovers to base with a split step. Player B catches and re-feeds. After 10 shots, switch roles. Coaching Point: Watch for early racket preparation — racket should be up before the last step into the corner."

Do NOT write vague descriptions like "The player should be in a low stance with good racket position." Always describe what players actively DO.

For each level, provide:
1. A title (e.g., "Foundation: Net Kill Basics")
2. A brief description of the level's coaching focus and objectives
3. 4-5 exercises following the session structure above, each with:
   - name: Clear drill name
   - description: Must follow the Setup → Instructions → Coaching Point format
   - duration: Time allocation (e.g., "10 minutes", "15 minutes")
   - reps: Number of reps if applicable (optional)
   - tips: The coaching point — key technical/tactical cue

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Program Title",
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
            "You are a BWF (Badminton World Federation) certified Level 1 Coach specializing in junior development (ages 10-15). You design structured 1-hour training sessions following the BWF Coach Education framework. Each session must follow a clear progression: Warm-up → Technical Focus → Pressure Drill → Match Play/Conditioned Game → Cool Down & Review. Every drill must use the format: Setup (players, positions, equipment) → Instructions (step-by-step actions, shot sequences, scoring) → Coaching Point (key technical/tactical cue). Never describe static positions or ideal form — always describe what players actively do. Respond with valid JSON only, no markdown.",
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
