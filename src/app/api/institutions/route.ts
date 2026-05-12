import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);

    if (me.role === "SUPER_ADMIN") {
      const items = await prisma.institution.findMany({
        orderBy: { createdAt: "desc" },
      });
      return jsonOk({ items });
    }

    if (me.role === "INSTITUTION_ADMIN" && me.institutionId) {
      const one = await prisma.institution.findUnique({
        where: { id: me.institutionId },
      });
      return jsonOk({ items: one ? [one] : [] });
    }

    if (
      (me.role === "PROGRAM_MANAGER" || me.role === "MENTOR") &&
      me.institutionId
    ) {
      const one = await prisma.institution.findUnique({
        where: { id: me.institutionId },
      });
      return jsonOk({ items: one ? [one] : [] });
    }

    return jsonError("Forbidden", 403);
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "UNIVERSITY",
    "PUBLIC_AGENCY",
    "COMPANY",
    "STARTUP_CENTER",
    "LOCAL_GOVERNMENT",
  ]),
  region: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    if (me.role !== "SUPER_ADMIN") return jsonError("Forbidden", 403);

    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const inst = await prisma.institution.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        region: parsed.data.region,
        address: parsed.data.address,
        website: parsed.data.website || undefined,
        contactName: parsed.data.contactName,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone,
      },
    });

    await writeAudit({
      userId: me.id,
      institutionId: inst.id,
      action: "INSTITUTION_CREATE",
      targetType: "Institution",
      targetId: inst.id,
    });

    return jsonOk({ institution: inst });
  } catch (e) {
    return handleRouteError(e);
  }
}
