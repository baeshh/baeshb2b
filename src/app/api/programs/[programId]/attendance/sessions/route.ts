import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ programId: string }> };

const schema = z.object({
  title: z.string().min(1),
  sessionDate: z.string().datetime(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const session = await prisma.attendanceSession.create({
      data: {
        programId,
        title: parsed.data.title,
        sessionDate: new Date(parsed.data.sessionDate),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      },
    });
    await writeAudit({
      userId: me.id,
      institutionId: me.institutionId,
      action: "ATTENDANCE_SESSION_CREATE",
      targetType: "AttendanceSession",
      targetId: session.id,
    });
    return jsonOk({ session });
  } catch (e) {
    return handleRouteError(e);
  }
}
