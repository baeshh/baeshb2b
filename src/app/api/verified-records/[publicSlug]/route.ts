import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ publicSlug: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const { publicSlug } = await ctx.params;
    const record = await prisma.verifiedRecord.findUnique({
      where: { publicSlug },
      include: {
        participant: { include: { user: { select: { name: true } } } },
        program: true,
        institution: { select: { id: true, name: true } },
      },
    });
    if (!record) return jsonError("Not found", 404);
    if (record.visibility === "PRIVATE") {
      return jsonError("Not found", 404);
    }
    return jsonOk({ record });
  } catch (e) {
    return handleRouteError(e);
  }
}
