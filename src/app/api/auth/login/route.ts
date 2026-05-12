import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const user = await prisma.user.findFirst({
      where: { email: parsed.data.email, deletedAt: null },
    });
    if (!user) return jsonError("Invalid credentials", 401);

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return jsonError("Invalid credentials", 401);

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    });

    await writeAudit({
      userId: user.id,
      institutionId: user.institutionId,
      action: "USER_LOGIN",
      targetType: "User",
      targetId: user.id,
    });

    const res = jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
      },
    });
    attachAuthCookie(res, token);
    return res;
  } catch (e) {
    return handleRouteError(e);
  }
}
