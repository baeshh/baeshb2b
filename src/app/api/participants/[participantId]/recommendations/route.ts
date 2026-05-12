import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertParticipantRowAccess } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ participantId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { participantId } = await ctx.params;
    const row = await prisma.programParticipant.findUnique({
      where: { id: participantId },
    });
    if (!row) return jsonError("Not found", 404);
    await assertParticipantRowAccess(me, row.programId, participantId);
    const items = await prisma.recommendation.findMany({
      where: { participantId },
      include: { opportunity: true },
      orderBy: { score: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}
