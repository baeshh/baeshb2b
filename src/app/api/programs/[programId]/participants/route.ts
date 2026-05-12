import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { hashPassword } from "@/lib/auth/password";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    const ctxp = await assertProgramAccess(me, programId);

    const items = await prisma.programParticipant.findMany({
      where: { programId },
      include: { user: { select: { id: true, email: true, name: true, role: true } }, team: true },
      orderBy: { joinedAt: "desc" },
    });

    if (me.role === "PARTICIPANT" && ctxp.participant) {
      const self = items.filter((i) => i.id === ctxp.participant!.id);
      return jsonOk({ items: self });
    }

    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
  status: z
    .enum(["INVITED", "ACTIVE", "DROPPED", "COMPLETED", "CERTIFIED"])
    .optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);

    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const program = await prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program) return jsonError("Program not found", 404);

    let user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: parsed.data.email,
          passwordHash: await hashPassword(randomUUID() + randomUUID()),
          name: parsed.data.name,
          phone: parsed.data.phone,
          role: "PARTICIPANT",
          institutionId: program.institutionId,
        },
      });
    }

    const row = await prisma.programParticipant.create({
      data: {
        programId,
        userId: user.id,
        status: parsed.data.status ?? "INVITED",
        roleTitle: parsed.data.roleTitle,
      },
    });

    await writeAudit({
      userId: me.id,
      institutionId: program.institutionId,
      action: "PARTICIPANT_ADD",
      targetType: "ProgramParticipant",
      targetId: row.id,
    });

    return jsonOk({ participant: row });
  } catch (e) {
    return handleRouteError(e);
  }
}
