import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createPresignedGet } from "@/lib/services/s3-service";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ fileId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { fileId } = await ctx.params;
    const file = await prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!file) return jsonError("Not found", 404);
    if (me.role !== "SUPER_ADMIN" && me.institutionId !== file.institutionId) {
      return jsonError("Forbidden", 403);
    }
    try {
      const url = await createPresignedGet(file.s3Key);
      return jsonOk({ file, downloadUrl: url });
    } catch {
      return jsonOk({
        file,
        downloadUrl: null,
        message: "S3 is not configured or object is unavailable",
      });
    }
  } catch (e) {
    return handleRouteError(e);
  }
}
