import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = {
  params: Promise<{ programId: string; recordId: string }>;
};

const schema = z.object({
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REVOKED"]),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId, recordId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const existing = await prisma.verifiedRecord.findFirst({
      where: { id: recordId, programId },
    });
    if (!existing) return jsonError("Not found", 404);

    const record = await prisma.verifiedRecord.update({
      where: { id: existing.id },
      data: {
        verificationStatus: parsed.data.verificationStatus,
        verifiedById:
          parsed.data.verificationStatus === "VERIFIED" ? me.id : null,
        verifiedAt:
          parsed.data.verificationStatus === "VERIFIED" ? new Date() : null,
      },
    });
    return jsonOk({ record });
  } catch (e) {
    return handleRouteError(e);
  }
}
