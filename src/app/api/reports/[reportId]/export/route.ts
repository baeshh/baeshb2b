import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ reportId: string }> };

export async function POST(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { reportId } = await ctx.params;
    const report = await prisma.generatedReport.findUnique({
      where: { id: reportId },
    });
    if (!report) return jsonError("Not found", 404);
    await assertProgramWrite(me, report.programId);
    const updated = await prisma.generatedReport.update({
      where: { id: reportId },
      data: { status: "EXPORTED" },
    });
    return jsonOk({
      report: updated,
      export: {
        format: "html",
        message:
          "PDF/ZIP보내기는 Phase 2에서 S3 기반으로 연결됩니다. 현재는 상태만 EXPORTED로 표시합니다.",
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
