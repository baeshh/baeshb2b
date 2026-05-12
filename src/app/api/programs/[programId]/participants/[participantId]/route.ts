import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import {
  assertParticipantRowAccess,
  assertProgramWrite,
} from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = {
  params: Promise<{ programId: string; participantId: string }>;
};

const patchSchema = z.object({
  teamId: z.string().nullable().optional(),
  status: z
    .enum(["INVITED", "ACTIVE", "DROPPED", "COMPLETED", "CERTIFIED"])
    .optional(),
  roleTitle: z.string().optional().nullable(),
  finalScore: z.number().optional().nullable(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId, participantId } = await ctx.params;
    await assertProgramWrite(me, programId);

    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const existing = await prisma.programParticipant.findFirst({
      where: { id: participantId, programId },
    });
    if (!existing) return jsonError("Not found", 404);

    const row = await prisma.programParticipant.update({
      where: { id: existing.id },
      data: parsed.data as never,
    });

    await writeAudit({
      userId: me.id,
      institutionId: me.institutionId,
      action: "PARTICIPANT_UPDATE",
      targetType: "ProgramParticipant",
      targetId: participantId,
    });

    return jsonOk({ participant: row });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId, participantId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const existing = await prisma.programParticipant.findFirst({
      where: { id: participantId, programId },
    });
    if (!existing) return jsonError("Not found", 404);

    await prisma.programParticipant.delete({
      where: { id: existing.id },
    });
    await writeAudit({
      userId: me.id,
      institutionId: me.institutionId,
      action: "PARTICIPANT_DELETE",
      targetType: "ProgramParticipant",
      targetId: participantId,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId, participantId } = await ctx.params;
    await assertParticipantRowAccess(me, programId, participantId);
    const participant = await prisma.programParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            profileImageUrl: true,
            createdAt: true,
          },
        },
        program: { include: { institution: true } },
        team: true,
        attendanceRecords: {
          include: { session: true },
          orderBy: { checkedAt: "desc" },
        },
        taskSubmissions: {
          include: { task: true, files: true },
          orderBy: { updatedAt: "desc" },
        },
        feedbacks: { orderBy: { createdAt: "desc" } },
        evaluations: { orderBy: { createdAt: "desc" } },
        outcomes: { orderBy: { createdAt: "desc" } },
        verifiedRecords: true,
      },
    });
    return jsonOk({ participant });
  } catch (e) {
    return handleRouteError(e);
  }
}
