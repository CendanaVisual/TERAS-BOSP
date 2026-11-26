import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "teras_bosp_session";

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "teras-bosp-fallback-dev-secret-change-in-production-32chars";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role === "OPERATOR" ? "OPERATOR" : "ADMIN",
    };
  } catch {
    return null;
  }
}
