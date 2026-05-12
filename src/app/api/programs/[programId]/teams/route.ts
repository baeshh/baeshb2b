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
    const items = await prisma.team.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { participants: true } },
      },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const team = await prisma.team.create({
      data: {
        programId,
        name: parsed.data.name,
        description: parsed.data.description,
      },
    });
    await writeAudit({
      userId: me.id,
      institutionId: me.institutionId,
      action: "TEAM_CREATE",
      targetType: "Team",
      targetId: team.id,
    });
    return jsonOk({ team });
  } catch (e) {
    return handleRouteError(e);
  }
}
