import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 400 }
    );
  }

  const { theme, intensity, levelCount } = await request.json();

  const openai = new OpenAI({ apiKey: user.openaiApiKey });

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
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ program: parsed });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
