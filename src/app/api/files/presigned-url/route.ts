import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess } from "@/lib/program-access";
import { buildS3ObjectKey, createPresignedUpload } from "@/lib/services/s3-service";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

const schema = z.object({
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
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

    const key = buildS3ObjectKey({
      institutionId: parsed.data.institutionId,
      programId: parsed.data.programId,
      filename: parsed.data.originalName,
    });

    const { url } = await createPresignedUpload({
      key,
      contentType: parsed.data.mimeType,
      contentLength: parsed.data.size,
    });

    return jsonOk({ uploadUrl: url, key });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload init failed";
    if (msg.includes("not configured")) {
      return jsonError("Object storage is not configured", 503);
    }
    return handleRouteError(e);
  }
}
