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
    await assertProgramAccess(me, task.programId);
    return jsonOk({ task });
  } catch (e) {
    return handleRouteError(e);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z
    .enum([
      "ASSIGNMENT",
      "TODO",
      "MILESTONE",
      "FINAL_OUTPUT",
      "SURVEY",
      "PRESENTATION",
    ])
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  required: z.boolean().optional(),
  maxScore: z.number().optional().nullable(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { taskId } = await ctx.params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Not found", 404);
    await assertProgramWrite(me, task.programId);
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const { dueDate, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (dueDate === null) data.dueDate = null;
    else if (dueDate) data.dueDate = new Date(dueDate);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: data as never,
    });
    return jsonOk({ task: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { taskId } = await ctx.params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Not found", 404);
    await assertProgramWrite(me, task.programId);
    await prisma.task.delete({ where: { id: taskId } });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
