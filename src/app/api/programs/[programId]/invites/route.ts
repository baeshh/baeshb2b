import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { hashInviteToken, generateInviteToken } from "@/lib/invite-token";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

const schema = z.object({
  email: z.string().email(),
  role: z.enum([
    "INSTITUTION_ADMIN",
    "PROGRAM_MANAGER",
    "MENTOR",
    "PARTICIPANT",
    "COMPANY_RECRUITER",
  ]),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return jsonError("Not found", 404);
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const token = generateInviteToken();
    const tokenHash = hashInviteToken(token);

    const invite = await prisma.invite.create({
      data: {
        email: parsed.data.email,
        tokenHash,
        role: parsed.data.role,
        institutionId: program.institutionId,
        programId,
        invitedById: me.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return jsonOk({
      inviteId: invite.id,
      token,
      acceptUrl: `${base}/register?token=${encodeURIComponent(token)}`,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
