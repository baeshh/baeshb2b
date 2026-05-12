import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);

    const files = await prisma.fileAsset.findMany({
      where: {
        OR: [
          { programId: programId },
          {
            taskSubmission: {
              task: { programId: programId },
            },
          },
          {
            outcomeEvidence: {
              some: { programId: programId },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ items: files });
  } catch (e) {
    return handleRouteError(e);
  }
}
