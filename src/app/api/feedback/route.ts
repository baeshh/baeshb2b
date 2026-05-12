import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertStaffCanModerate } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

const schema = z.object({
  programId: z.string().min(1),
  participantId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  taskSubmissionId: z.string().optional().nullable(),
  content: z.string().min(1),
  feedbackType: z
    .enum(["GENERAL", "TASK", "MENTORING", "EVALUATION"])
    .optional(),
});

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    await assertStaffCanModerate(me, parsed.data.programId);
    const fb = await prisma.feedback.create({
      data: {
        programId: parsed.data.programId,
        participantId: parsed.data.participantId ?? undefined,
        teamId: parsed.data.teamId ?? undefined,
        taskSubmissionId: parsed.data.taskSubmissionId ?? undefined,
        mentorId: me.id,
        content: parsed.data.content,
        feedbackType: parsed.data.feedbackType ?? "GENERAL",
      },
    });
    return jsonOk({ feedback: fb });
  } catch (e) {
    return handleRouteError(e);
  }
}
