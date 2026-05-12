import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authCookie, verifyToken, type JwtPayload } from "@/lib/auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string | null;
};

export async function getJwtPayload(): Promise<JwtPayload | null> {
  const token = (await cookies()).get(authCookie.name)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await getJwtPayload();
  if (!payload) return null;
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null },
  });
  if (!user) return null;
  if (user.email !== payload.email || user.role !== payload.role) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
  };
}

/** Route Handler에서 반환하는 NextResponse에 토큰을 붙입니다. */
export function attachAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(authCookie.name, token, {
    ...authCookie.options,
    maxAge: authCookie.maxAge,
  });
}

/** Route Handler 응답에서 로그인 쿠키를 제거합니다. */
export function clearAuthCookieOnResponse(res: NextResponse) {
  res.cookies.set(authCookie.name, "", {
    ...authCookie.options,
    maxAge: 0,
  });
}
