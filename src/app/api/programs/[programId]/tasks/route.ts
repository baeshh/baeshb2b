import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);
    const items = await prisma.task.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "ASSIGNMENT",
    "TODO",
    "MILESTONE",
    "FINAL_OUTPUT",
    "SURVEY",
    "PRESENTATION",
  ]),
  dueDate: z.string().datetime().optional(),
  required: z.boolean().optional(),
  maxScore: z.number().optional().nullable(),
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
    const task = await prisma.task.create({
      data: {
        programId,
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        dueDate: parsed.data.dueDate
          ? new Date(parsed.data.dueDate)
          : undefined,
        required: parsed.data.required ?? true,
        maxScore: parsed.data.maxScore ?? undefined,
        createdById: me.id,
      },
    });
    await writeAudit({
      userId: me.id,
      institutionId: me.institutionId,
      action: "TASK_CREATE",
      targetType: "Task",
      targetId: task.id,
    });
    return jsonOk({ task });
  } catch (e) {
    return handleRouteError(e);
  }
}
