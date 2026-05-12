import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);
    const items = await prisma.generatedReport.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { id: true, title: true } },
        generatedBy: { select: { id: true, name: true } },
      },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}
