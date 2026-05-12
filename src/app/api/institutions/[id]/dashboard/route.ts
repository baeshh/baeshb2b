import { getSessionUser } from "@/lib/auth/session";
import { getInstitutionDashboardMetrics } from "@/lib/services/institution-metrics";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;

    if (me.role !== "SUPER_ADMIN") {
      if (!me.institutionId || me.institutionId !== id) {
        return jsonError("Forbidden", 403);
      }
      if (
        me.role !== "INSTITUTION_ADMIN" &&
        me.role !== "PROGRAM_MANAGER"
      ) {
        return jsonError("Forbidden", 403);
      }
    }

    const metrics = await getInstitutionDashboardMetrics(id);
    return jsonOk({ metrics });
  } catch (e) {
    return handleRouteError(e);
  }
}
