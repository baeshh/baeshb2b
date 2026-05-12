import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    const ctxp = await assertProgramAccess(me, programId);
    const where: { programId: string; participantId?: string } = { programId };
    if (me.role === "PARTICIPANT" && ctxp.participant) {
      where.participantId = ctxp.participant.id;
    }
    const items = await prisma.outcome.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        participant: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const schema = z.object({
  participantId: z.string().min(1),
  type: z.enum([
    "EMPLOYMENT",
    "STARTUP",
    "LOCAL_SETTLEMENT",
    "AWARD",
    "NEXT_PROGRAM",
    "INVESTMENT",
    "NONE",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  organizationName: z.string().optional().nullable(),
  occurredAt: z.string().datetime().optional().nullable(),
  evidenceFileId: z.string().optional().nullable(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const outcome = await prisma.outcome.create({
      data: {
        programId,
        participantId: parsed.data.participantId,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        organizationName: parsed.data.organizationName ?? undefined,
        occurredAt: parsed.data.occurredAt
          ? new Date(parsed.data.occurredAt)
          : undefined,
        evidenceFileId: parsed.data.evidenceFileId ?? undefined,
      },
    });
    return jsonOk({ outcome });
  } catch (e) {
    return handleRouteError(e);
  }
}
