import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  criteriaJson: z.any(),
});

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);
    const items = await prisma.evaluationRubric.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const rubric = await prisma.evaluationRubric.create({
      data: {
        programId,
        title: parsed.data.title,
        description: parsed.data.description,
        criteriaJson: parsed.data.criteriaJson,
      },
    });
    return jsonOk({ rubric });
  } catch (e) {
    return handleRouteError(e);
  }
}
