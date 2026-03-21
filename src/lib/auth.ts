import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { getUser, getUserByEmail, createUser } from "./db";
import { User } from "./types";

const SESSION_COOKIE = "bb_session";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return (await getUser(sessionId)) || null;
}

export async function loginWithGoogle(email: string, name: string): Promise<User> {
  let user = await getUserByEmail(email);
  if (!user) {
    user = await createUser({
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
