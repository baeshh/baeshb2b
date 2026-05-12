import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertInstitutionAdmin } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ templateId: string }> };

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  sectionsJson: z.any().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { templateId } = await ctx.params;
    const tpl = await prisma.reportTemplate.findUnique({
      where: { id: templateId },
    });
    if (!tpl) return jsonError("Not found", 404);
    if (tpl.institutionId) {
      if (me.role !== "SUPER_ADMIN") {
        await assertInstitutionAdmin(me, tpl.institutionId);
      }
    } else if (me.role !== "SUPER_ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const updated = await prisma.reportTemplate.update({
      where: { id: templateId },
      data: parsed.data as never,
    });
    return jsonOk({ template: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { templateId } = await ctx.params;
    const tpl = await prisma.reportTemplate.findUnique({
      where: { id: templateId },
    });
    if (!tpl) return jsonError("Not found", 404);
    if (!tpl.institutionId) return jsonError("Cannot delete system template", 400);
    if (me.role !== "SUPER_ADMIN") {
      await assertInstitutionAdmin(me, tpl.institutionId);
    }
    await prisma.reportTemplate.delete({ where: { id: templateId } });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
