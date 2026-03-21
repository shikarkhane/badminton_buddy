import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { getUser, getUserByEmail, createUser } from "./db";
import { User } from "./types";

const SESSION_COOKIE = "bb_session";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return getUser(sessionId) || null;
}

export function loginWithGoogle(email: string, name: string): User {
  let user = getUserByEmail(email);
  if (!user) {
    user = createUser({
      id: uuidv4(),
      email,
      name,
      isGuest: false,
      openaiApiKey: null,
      locale: "en",
      createdAt: new Date().toISOString(),
    });
  }
  return user;
}

export function createGuestUser(): User {
  return createUser({
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
