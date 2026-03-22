import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { getUser, getUserByEmail, createUser, getUserPasswordHashByEmail } from "./db";
import { verifyPassword } from "./crypto";
import { User } from "./types";

const SESSION_COOKIE = "bb_session";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return (await getUser(sessionId)) || null;
}

export async function loginWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{ user: User } | { error: string }> {
  const existing = await getUserByEmail(email);

  if (existing) {
    // Existing user — verify password
    const record = await getUserPasswordHashByEmail(email);
    if (record?.passwordHash) {
      if (!verifyPassword(password, record.passwordHash)) {
        return { error: "Incorrect password" };
      }
    }
    // If no password set yet (legacy user), allow login and don't force password
    return { user: existing };
  }

  // New user — create with password
  const user = await createUser(
    {
      id: uuidv4(),
      email,
      name: name || email.split("@")[0],
      isGuest: false,
      openaiApiKey: null,
      locale: "en",
      createdAt: new Date().toISOString(),
    },
    password
  );
  return { user };
}

export async function createGuestUser(): Promise<User> {
  return await createUser({
    id: uuidv4(),
    email: null,
    name: "Guest",
    isGuest: true,
    openaiApiKey: null,
    locale: "en",
    createdAt: new Date().toISOString(),
  });
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}
