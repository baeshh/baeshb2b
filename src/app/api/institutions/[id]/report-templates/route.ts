import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertInstitutionAdmin } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;

    if (me.role === "SUPER_ADMIN") {
      const items = await prisma.reportTemplate.findMany({
        where: { OR: [{ institutionId: null }, { institutionId: id }] },
        orderBy: { updatedAt: "desc" },
      });
      return jsonOk({ items });
    }

    if (me.institutionId !== id) return jsonError("Forbidden", 403);
    if (
      me.role !== "INSTITUTION_ADMIN" &&
      me.role !== "PROGRAM_MANAGER"
    ) {
      return jsonError("Forbidden", 403);
    }

    const items = await prisma.reportTemplate.findMany({
      where: { OR: [{ institutionId: id }, { institutionId: null }] },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sectionsJson: z.any(),
  isDefault: z.boolean().optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;
    if (me.role !== "SUPER_ADMIN") {
      await assertInstitutionAdmin(me, id);
    }

    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const tpl = await prisma.reportTemplate.create({
      data: {
        institutionId: id,
        title: parsed.data.title,
        description: parsed.data.description,
        sectionsJson: parsed.data.sectionsJson,
        isDefault: parsed.data.isDefault ?? false,
      },
    });
    return jsonOk({ template: tpl });
  } catch (e) {
    return handleRouteError(e);
  }
}
