import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string; teamId: string }> };

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId, teamId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const team = await prisma.team.findFirst({
      where: { id: teamId, programId },
    });
    if (!team) return jsonError("Not found", 404);
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: parsed.data as never,
    });
    return jsonOk({ team: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId, teamId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const team = await prisma.team.findFirst({
      where: { id: teamId, programId },
    });
    if (!team) return jsonError("Not found", 404);
    await prisma.team.delete({ where: { id: teamId } });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
