import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

const schema = z.object({
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  s3Key: z.string().min(1),
  institutionId: z.string().min(1),
  programId: z.string().optional().nullable(),
  taskSubmissionId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    if (
      me.role !== "SUPER_ADMIN" &&
      me.institutionId !== parsed.data.institutionId
    ) {
      return jsonError("Forbidden", 403);
    }

    if (parsed.data.programId) {
      await assertProgramAccess(me, parsed.data.programId);
    }

    const file = await prisma.fileAsset.create({
      data: {
        ownerId: me.id,
        institutionId: parsed.data.institutionId,
        programId: parsed.data.programId ?? undefined,
        taskSubmissionId: parsed.data.taskSubmissionId ?? undefined,
        originalName: parsed.data.originalName,
        mimeType: parsed.data.mimeType,
        size: parsed.data.size,
        s3Key: parsed.data.s3Key,
      },
    });
    return jsonOk({ file });
  } catch (e) {
    return handleRouteError(e);
  }
}
