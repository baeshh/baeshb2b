import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess } from "@/lib/program-access";
import { getProgramDashboardMetrics } from "@/lib/services/program-metrics";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);
    const metrics = await getProgramDashboardMetrics(programId);
    return jsonOk({ metrics });
  } catch (e) {
    return handleRouteError(e);
  }
}
