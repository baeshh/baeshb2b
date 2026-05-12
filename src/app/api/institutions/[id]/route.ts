import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertInstitutionAdmin } from "@/lib/program-access";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;

    if (me.role === "SUPER_ADMIN") {
      const inst = await prisma.institution.findUnique({ where: { id } });
      if (!inst) return jsonError("Not found", 404);
      return jsonOk({ institution: inst });
    }

    if (me.institutionId !== id) return jsonError("Forbidden", 403);
    if (
      me.role !== "INSTITUTION_ADMIN" &&
      me.role !== "PROGRAM_MANAGER" &&
      me.role !== "MENTOR" &&
      me.role !== "PARTICIPANT"
    ) {
      return jsonError("Forbidden", 403);
    }

    const inst = await prisma.institution.findUnique({ where: { id } });
    if (!inst) return jsonError("Not found", 404);
    return jsonOk({ institution: inst });
  } catch (e) {
    return handleRouteError(e);
  }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  type: z
    .enum([
      "UNIVERSITY",
      "PUBLIC_AGENCY",
      "COMPANY",
      "STARTUP_CENTER",
      "LOCAL_GOVERNMENT",
    ])
    .optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  subscriptionStatus: z
    .enum(["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED"])
    .optional(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;

    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    if (me.role === "SUPER_ADMIN") {
      const inst = await prisma.institution.update({
        where: { id },
        data: {
          ...parsed.data,
          website:
            parsed.data.website === "" ? null : parsed.data.website,
        },
      });
      await writeAudit({
        userId: me.id,
        institutionId: id,
        action: "INSTITUTION_UPDATE",
        targetType: "Institution",
        targetId: id,
      });
      return jsonOk({ institution: inst });
    }

    await assertInstitutionAdmin(me, id);
    const { subscriptionStatus: _subscriptionStatus, ...rest } = parsed.data;
    void _subscriptionStatus;
    const inst = await prisma.institution.update({
      where: { id },
      data: {
        ...rest,
        website: rest.website === "" ? null : rest.website,
      },
    });
    await writeAudit({
      userId: me.id,
      institutionId: id,
      action: "INSTITUTION_UPDATE",
      targetType: "Institution",
      targetId: id,
    });
    return jsonOk({ institution: inst });
  } catch (e) {
    return handleRouteError(e);
  }
}
