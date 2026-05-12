import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const items = await prisma.opportunity.findMany({
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const schema = z.object({
  type: z.enum([
    "JOB",
    "STARTUP_PROGRAM",
    "CONTEST",
    "MENTORING",
    "GOVERNMENT_SUPPORT",
    "INTERNSHIP",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  organizationName: z.string().min(1),
  region: z.string().optional(),
  requirementsJson: z.any().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  url: z.string().url().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    if (me.role !== "SUPER_ADMIN" && me.role !== "INSTITUTION_ADMIN") {
      return jsonError("Forbidden", 403);
    }
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const op = await prisma.opportunity.create({
      data: {
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        organizationName: parsed.data.organizationName,
        region: parsed.data.region,
        requirementsJson: parsed.data.requirementsJson,
        startDate: parsed.data.startDate
          ? new Date(parsed.data.startDate)
          : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        url: parsed.data.url ?? undefined,
      },
    });
    return jsonOk({ opportunity: op });
  } catch (e) {
    return handleRouteError(e);
  }
}
