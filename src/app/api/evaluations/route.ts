import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertStaffCanModerate } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

const schema = z.object({
  programId: z.string().min(1),
  participantId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  rubricId: z.string().optional().nullable(),
  score: z.number().optional().nullable(),
  content: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    await assertStaffCanModerate(me, parsed.data.programId);
    const ev = await prisma.evaluation.create({
      data: {
        programId: parsed.data.programId,
        participantId: parsed.data.participantId ?? undefined,
        teamId: parsed.data.teamId ?? undefined,
        evaluatorId: me.id,
        rubricId: parsed.data.rubricId ?? undefined,
        score: parsed.data.score ?? undefined,
        content: parsed.data.content,
        strengths: parsed.data.strengths,
        improvements: parsed.data.improvements,
      },
    });
    return jsonOk({ evaluation: ev });
  } catch (e) {
    return handleRouteError(e);
  }
}
