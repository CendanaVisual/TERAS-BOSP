import "server-only";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import {
  AdminSessionPayload,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "./auth-token";

export { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken };
export type { AdminSessionPayload };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function setSessionCookie(
  token: string,
  isHttpsRequest?: boolean
): Promise<void> {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const forwardedProto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = Boolean(isHttpsRequest || forwardedProto === "https");

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
