import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/generated/prisma/enums";
import { getEnv } from "@/lib/env";

const COOKIE_NAME = "baesh_token";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
};

function getKey() {
  return new TextEncoder().encode(getEnv().jwtSigningSecret);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    institutionId: payload.institutionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getKey());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    const sub = payload.sub;
    const email = payload.email as string | undefined;
    const role = payload.role as UserRole | undefined;
    if (!sub || !email || !role) return null;
    return {
      sub,
      email,
      role,
      institutionId: (payload.institutionId as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

/** HTTP 로컬에서 NODE_ENV=production이어도 쿠키가 저장되도록 URL 기준으로 결정 */
export function shouldUseSecureCookie(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (base.startsWith("https://")) return true;
  if (base.startsWith("http://")) return false;
  return process.env.NODE_ENV === "production";
}

export const authCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SEC,
  get options() {
    return {
      httpOnly: true as const,
      sameSite: "lax" as const,
      secure: shouldUseSecureCookie(),
      path: "/" as const,
    };
  },
};
