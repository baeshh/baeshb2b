import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { reportId } = await ctx.params;
    const report = await prisma.generatedReport.findUnique({
      where: { id: reportId },
      include: { program: true, template: { select: { id: true, title: true } } },
    });
    if (!report) return jsonError("Not found", 404);
    await assertProgramWrite(me, report.programId);
    return jsonOk({ report });
  } catch (e) {
    return handleRouteError(e);
  }
}

const patchSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional().nullable(),
  sectionsJson: z.any().optional(),
  status: z.enum(["DRAFT", "GENERATED", "EXPORTED"]).optional(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { reportId } = await ctx.params;
    const report = await prisma.generatedReport.findUnique({
      where: { id: reportId },
    });
    if (!report) return jsonError("Not found", 404);
    await assertProgramWrite(me, report.programId);
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const updated = await prisma.generatedReport.update({
      where: { id: reportId },
      data: parsed.data as never,
    });
    return jsonOk({ report: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
