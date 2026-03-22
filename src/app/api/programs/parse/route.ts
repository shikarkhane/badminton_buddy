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

  const prompt = `Convert the following free-text description of a badminton training program into a structured JSON format.

User's description:
"""
${text}
"""

Interpret the user's intent and create a well-structured training program. If they mention specific drills, exercises, or levels, use those. If the description is vague, fill in reasonable details based on what a badminton coach would recommend.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Program Title",
  "theme": "Main training theme",
  "intensity": "low" | "medium" | "high" | "extreme",
  "levels": [
    {
      "level": 1,
      "title": "Level Title",
      "description": "Level description",
      "exercises": [
        {
          "name": "Exercise name",
          "description": "Step-by-step setup: how to arrange players, equipment, and court positions. Then describe the gameplay/drill flow.",
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
            "You are a professional badminton coach. Convert free-text training descriptions into structured training programs. Always respond with valid JSON only.",
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
