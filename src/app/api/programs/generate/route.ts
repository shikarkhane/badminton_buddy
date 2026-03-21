import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

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

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Please add your key in Settings." },
      { status: 400 }
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
3. 3-5 exercises, each with:
   - name: Exercise name
   - description: How to perform it
   - duration: Time or duration (e.g., "15 minutes", "3 sets")
   - reps: Number of reps if applicable (optional)
   - tips: Key coaching tips

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
          "description": "How to do it",
          "duration": "15 minutes",
          "reps": "10 per side",
          "tips": "Key tip"
        }
      ]
    }
  ]
}`;

  let openai: OpenAI;
  try {
    openai = new OpenAI({ apiKey: user.openaiApiKey });
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
            "You are a professional badminton coach creating structured training programs. Always respond with valid JSON only, no markdown formatting.",
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

    return NextResponse.json({ program: parsed });
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Your OpenAI API key is invalid. Please check it in Settings." },
          { status: 400 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "OpenAI rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      if (error.status === 402 || error.message?.includes("insufficient_quota")) {
        return NextResponse.json(
          { error: "Your OpenAI account has no credits. Please add billing at platform.openai.com." },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: `OpenAI error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
