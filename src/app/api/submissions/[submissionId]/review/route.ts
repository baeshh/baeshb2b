import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertStaffCanModerate } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ submissionId: string }> };

const schema = z.object({
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "REVIEWED",
    "REVISION_REQUIRED",
    "APPROVED",
  ]),
  score: z.number().optional().nullable(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { submissionId } = await ctx.params;
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });
    if (!submission) return jsonError("Not found", 404);
    await assertStaffCanModerate(me, submission.task.programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const updated = await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        status: parsed.data.status,
        score: parsed.data.score ?? undefined,
        reviewedAt: new Date(),
      },
    });
    return jsonOk({ submission: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
