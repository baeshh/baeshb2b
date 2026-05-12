import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ submissionId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { submissionId } = await ctx.params;
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true, files: true, participant: true },
    });
    if (!submission) return jsonError("Not found", 404);
    const ctxp = await assertProgramAccess(me, submission.task.programId);
    if (
      me.role === "PARTICIPANT" &&
      (!ctxp.participant || ctxp.participant.id !== submission.participantId)
    ) {
      return jsonError("Forbidden", 403);
    }
    return jsonOk({ submission });
  } catch (e) {
    return handleRouteError(e);
  }
}
