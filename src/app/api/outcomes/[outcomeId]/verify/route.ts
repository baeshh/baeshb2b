import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ outcomeId: string }> };

const schema = z.object({
  verified: z.boolean(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { outcomeId } = await ctx.params;
    const outcome = await prisma.outcome.findUnique({
      where: { id: outcomeId },
      include: { program: true },
    });
    if (!outcome) return jsonError("Not found", 404);
    await assertProgramWrite(me, outcome.programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const updated = await prisma.outcome.update({
      where: { id: outcomeId },
      data: {
        verifiedById: parsed.data.verified ? me.id : null,
        verifiedAt: parsed.data.verified ? new Date() : null,
      },
    });
    return jsonOk({ outcome: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
