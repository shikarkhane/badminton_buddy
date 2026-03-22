import OpenAI from "openai";
import { User } from "./types";
import { countRecentAiUsage, recordAiUsage } from "./db";

const PUBLIC_DAILY_LIMIT = 10;

/**
 * Resolves the OpenAI API key to use for a request.
 * Priority: user's own key > site-wide OPENAI_API_KEY env var (with rate limit).
 *
 * Returns { apiKey, isPublic } or { error, status } if no key is available.
 */
export async function resolveOpenAIKey(
  user: User
): Promise<
  | { apiKey: string; isPublic: boolean }
  | { error: string; status: number }
> {
  // 1. User has their own key — always use it
  if (user.openaiApiKey) {
    return { apiKey: user.openaiApiKey, isPublic: false };
  }

  // 2. Fall back to site-wide public key
  const publicKey = process.env.OPENAI_API_KEY;
  if (!publicKey) {
    return {
      error:
        "No OpenAI API key configured. Please add your key in Settings.",
      status: 400,
    };
  }

  // 3. Check rate limit for public key usage
  const used = await countRecentAiUsage(user.id, 24);
  if (used >= PUBLIC_DAILY_LIMIT) {
    return {
      error: `You've used all ${PUBLIC_DAILY_LIMIT} free AI credits for today. Add your own OpenAI API key in Settings for unlimited access.`,
      status: 429,
    };
  }

  return { apiKey: publicKey, isPublic: true };
}

/**
 * Records a public-key AI call for rate limiting.
 * Call this AFTER a successful OpenAI response when isPublic is true.
 */
export async function trackPublicUsage(
  userId: string,
  isPublic: boolean
): Promise<void> {
  if (isPublic) {
    await recordAiUsage(userId);
  }
}

/**
 * Returns remaining public credits for a user (for UI display).
 */
export async function getRemainingCredits(userId: string): Promise<number> {
  const used = await countRecentAiUsage(userId, 24);
  return Math.max(0, PUBLIC_DAILY_LIMIT - used);
}

/**
 * Maps OpenAI API errors to user-friendly messages.
 */
export function handleOpenAIError(
  error: unknown
): { error: string; status: number } {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return {
        error:
          "Your OpenAI API key is invalid. Please check it in Settings.",
        status: 400,
      };
    }
    if (error.status === 429) {
      return {
        error:
          "OpenAI rate limit reached. Please wait a moment and try again.",
        status: 429,
      };
    }
    if (
      error.status === 402 ||
      error.status === 500 ||
      error.message?.includes("insufficient_quota")
    ) {
      // 500 from OpenAI often means billing/quota issues
      const isQuota =
        error.status === 402 ||
        error.message?.includes("insufficient_quota") ||
        error.message?.includes("exceeded") ||
        error.message?.includes("billing");
      if (isQuota || error.status === 500) {
        return {
          error:
            "Your OpenAI account has no credits left. Please add billing at platform.openai.com or remove your key in Settings to use public credits.",
          status: 402,
        };
      }
    }
    return {
      error: `OpenAI error: ${error.message}`,
      status: error.status || 500,
    };
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return { error: message, status: 500 };
}
