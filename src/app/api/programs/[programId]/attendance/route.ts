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
    const sessions = await prisma.attendanceSession.findMany({
      where: { programId },
      include: { records: true },
      orderBy: { sessionDate: "desc" },
    });
    return jsonOk({ sessions });
  } catch (e) {
    return handleRouteError(e);
  }
}
