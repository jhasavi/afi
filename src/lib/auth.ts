import "server-only";
import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import { getAuthSecret } from "./env";

const COOKIE_NAME = "advisorflow_session";
const SESSION_DAYS = 30;

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getAuthSecret());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export type ActionAuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

// Use in server components — redirects to login when unauthenticated.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Use in server actions called from client components (fetch).
 * redirect() inside those actions causes "Failed to fetch" in the browser.
 */
export async function requireUserForAction(): Promise<ActionAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please log in again." };
  }
  return { ok: true, user };
}
