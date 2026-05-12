import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;
    const op = await prisma.opportunity.findUnique({ where: { id } });
    if (!op) return jsonError("Not found", 404);
    return jsonOk({ opportunity: op });
  } catch (e) {
    return handleRouteError(e);
  }
}
