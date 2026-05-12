import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ sessionId: string }> };

const schema = z.object({
  participantId: z.string().min(1),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
  note: z.string().optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { sessionId } = await ctx.params;
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return jsonError("Session not found", 404);
    await assertProgramWrite(me, session.programId);

    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const record = await prisma.attendanceRecord.upsert({
      where: {
        attendanceSessionId_participantId: {
          attendanceSessionId: sessionId,
          participantId: parsed.data.participantId,
        },
      },
      create: {
        attendanceSessionId: sessionId,
        participantId: parsed.data.participantId,
        status: parsed.data.status,
        note: parsed.data.note,
      },
      update: {
        status: parsed.data.status,
        note: parsed.data.note,
        checkedAt: new Date(),
      },
    });
    return jsonOk({ record });
  } catch (e) {
    return handleRouteError(e);
  }
}
