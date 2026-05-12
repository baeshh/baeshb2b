import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (me.role === "SUPER_ADMIN") {
      const inst = searchParams.get("institutionId");
      if (inst) where.institutionId = inst;
    } else if (me.role === "INSTITUTION_ADMIN") {
      if (!me.institutionId) return jsonError("Forbidden", 403);
      where.institutionId = me.institutionId;
    } else if (me.role === "PROGRAM_MANAGER") {
      where.staff = { some: { userId: me.id, role: "PROGRAM_MANAGER" } };
    } else if (me.role === "MENTOR") {
      where.staff = { some: { userId: me.id, role: "MENTOR" } };
    } else if (me.role === "PARTICIPANT") {
      where.participants = { some: { userId: me.id } };
    } else {
      return jsonError("Forbidden", 403);
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category as never;
    if (status) where.status = status as never;
    if (from || to) {
      const and = Array.isArray(where.AND)
        ? [...(where.AND as object[])]
        : ([] as object[]);
      if (from) and.push({ endDate: { gte: new Date(from) } });
      if (to) and.push({ startDate: { lte: new Date(to) } });
      where.AND = and;
    }

    const items = await prisma.program.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { institution: { select: { id: true, name: true } } },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  institutionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    "EDUCATION",
    "STARTUP",
    "CAPSTONE",
    "HACKATHON",
    "INTERNSHIP",
    "YOUTH_PROGRAM",
  ]),
  objective: z.string().optional(),
  targetParticipants: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z
    .enum(["DRAFT", "RECRUITING", "ACTIVE", "COMPLETED", "ARCHIVED"])
    .optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);

    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    if (me.role === "SUPER_ADMIN") {
      // ok
    } else if (me.role === "INSTITUTION_ADMIN") {
      if (me.institutionId !== parsed.data.institutionId) {
        return jsonError("Forbidden", 403);
      }
    } else if (me.role === "PROGRAM_MANAGER") {
      if (!me.institutionId || me.institutionId !== parsed.data.institutionId) {
        return jsonError("Forbidden", 403);
      }
    } else {
      return jsonError("Forbidden", 403);
    }

    const program = await prisma.$transaction(async (tx) => {
      const p = await tx.program.create({
        data: {
          institutionId: parsed.data.institutionId,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          objective: parsed.data.objective,
          targetParticipants: parsed.data.targetParticipants,
          startDate: new Date(parsed.data.startDate),
          endDate: new Date(parsed.data.endDate),
          status: parsed.data.status ?? "DRAFT",
          capacity: parsed.data.capacity,
          location: parsed.data.location,
          isOnline: parsed.data.isOnline ?? false,
          createdById: me.id,
        },
      });
      if (me.role === "PROGRAM_MANAGER") {
        await tx.programStaff.create({
          data: {
            programId: p.id,
            userId: me.id,
            role: "PROGRAM_MANAGER",
          },
        });
      }
      return p;
    });

    await writeAudit({
      userId: me.id,
      institutionId: program.institutionId,
      action: "PROGRAM_CREATE",
      targetType: "Program",
      targetId: program.id,
    });

    return jsonOk({ program });
  } catch (e) {
    return handleRouteError(e);
  }
}
