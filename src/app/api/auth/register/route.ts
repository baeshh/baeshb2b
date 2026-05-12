import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/session";
import { hashInviteToken } from "@/lib/invite-token";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
  inviteToken: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(parsed.error.message);
    }
    const { email, password, name, phone, inviteToken } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("Email already registered", 409);

    const tokenHash = hashInviteToken(inviteToken);
    const invite = await prisma.invite.findFirst({
      where: { tokenHash, acceptedAt: null },
    });
    if (!invite || invite.expiresAt < new Date()) {
      return jsonError("Invalid or expired invite", 400);
    }

    const role = invite.role;
    const institutionId = invite.institutionId ?? null;
    const programIdForStaff = invite.programId ?? null;

    if (role === "PARTICIPANT" && !programIdForStaff) {
      return jsonError("Participant invite must include a program", 400);
    }

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          name,
          phone,
          role,
          institutionId,
        },
      });

      if (
        programIdForStaff &&
        (role === "PROGRAM_MANAGER" || role === "MENTOR")
      ) {
        await tx.programStaff.create({
          data: {
            programId: programIdForStaff,
            userId: u.id,
            role:
              role === "PROGRAM_MANAGER" ? "PROGRAM_MANAGER" : "MENTOR",
          },
        });
      }

      if (role === "PARTICIPANT" && programIdForStaff) {
        await tx.programParticipant.upsert({
          where: {
            programId_userId: {
              programId: programIdForStaff,
              userId: u.id,
            },
          },
          create: {
            programId: programIdForStaff,
            userId: u.id,
            status: "ACTIVE",
          },
          update: { status: "ACTIVE" },
        });
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return u;
    });

    await writeAudit({
      userId: user.id,
      institutionId,
      action: "USER_REGISTER",
      targetType: "User",
      targetId: user.id,
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
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
