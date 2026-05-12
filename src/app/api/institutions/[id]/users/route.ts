import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertInstitutionAdmin } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;

    if (me.role === "SUPER_ADMIN") {
      const items = await prisma.user.findMany({
        where: { institutionId: id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      return jsonOk({ items });
    }

    await assertInstitutionAdmin(me, id);
    const items = await prisma.user.findMany({
      where: { institutionId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}
