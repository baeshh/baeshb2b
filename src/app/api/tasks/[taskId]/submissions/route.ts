import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ taskId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { taskId } = await ctx.params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Not found", 404);
    const ctxp = await assertProgramAccess(me, task.programId);
    const where: { taskId: string; participantId?: string } = { taskId };
    if (me.role === "PARTICIPANT" && ctxp.participant) {
      where.participantId = ctxp.participant.id;
    }
    const items = await prisma.taskSubmission.findMany({
      where,
      include: { files: true, participant: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const schema = z.object({
  participantId: z.string().min(1),
  teamId: z.string().optional().nullable(),
  title: z.string().optional(),
  content: z.string().optional(),
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "REVIEWED",
      "REVISION_REQUIRED",
      "APPROVED",
    ])
    .optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { taskId } = await ctx.params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Not found", 404);
    const ctxp = await assertProgramAccess(me, task.programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    if (me.role === "PARTICIPANT") {
      if (!ctxp.participant || ctxp.participant.id !== parsed.data.participantId) {
        return jsonError("Forbidden", 403);
      }
    } else {
      await assertProgramWrite(me, task.programId);
    }

    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        participantId: parsed.data.participantId,
        teamId: parsed.data.teamId ?? undefined,
        title: parsed.data.title,
        content: parsed.data.content,
        status: parsed.data.status ?? "DRAFT",
        submittedAt:
          parsed.data.status &&
          ["SUBMITTED", "REVIEWED", "REVISION_REQUIRED", "APPROVED"].includes(
            parsed.data.status,
          )
            ? new Date()
            : undefined,
      },
    });
    return jsonOk({ submission });
  } catch (e) {
    return handleRouteError(e);
  }
}
