import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { institution: true },
    });
    if (!program) return jsonError("Not found", 404);
    return jsonOk({ program });
  } catch (e) {
    return handleRouteError(e);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z
    .enum([
      "EDUCATION",
      "STARTUP",
      "CAPSTONE",
      "HACKATHON",
      "INTERNSHIP",
      "YOUTH_PROGRAM",
    ])
    .optional(),
  objective: z.string().optional(),
  targetParticipants: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z
    .enum(["DRAFT", "RECRUITING", "ACTIVE", "COMPLETED", "ARCHIVED"])
    .optional(),
  capacity: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  isOnline: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);

    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const { startDate, endDate, ...rest } = parsed.data;
    const program = await prisma.program.update({
      where: { id: programId },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      },
    });

    await writeAudit({
      userId: me.id,
      institutionId: program.institutionId,
      action: "PROGRAM_UPDATE",
      targetType: "Program",
      targetId: programId,
    });

    return jsonOk({ program });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    if (me.role !== "INSTITUTION_ADMIN" && me.role !== "SUPER_ADMIN") {
      return jsonError("Forbidden", 403);
    }
    await prisma.program.delete({ where: { id: programId } });
    await writeAudit({
      userId: me.id,
      institutionId: me.institutionId,
      action: "PROGRAM_DELETE",
      targetType: "Program",
      targetId: programId,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
