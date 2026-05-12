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
    const ctxp = await assertProgramAccess(me, programId);
    const where: { programId: string; participantId?: string } = { programId };
    if (me.role === "PARTICIPANT" && ctxp.participant) {
      where.participantId = ctxp.participant.id;
    }
    const items = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { mentor: { select: { id: true, name: true } } },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}
