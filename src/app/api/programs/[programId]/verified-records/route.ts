import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramAccess, assertProgramWrite } from "@/lib/program-access";
import { generatePublicSlug } from "@/lib/services/report-service";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { z } from "zod";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramAccess(me, programId);
    const items = await prisma.verifiedRecord.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
      include: {
        participant: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    return jsonOk({ items });
  } catch (e) {
    return handleRouteError(e);
  }
}

const schema = z.object({
  participantId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  role: z.string().optional(),
  skillsJson: z.any().optional(),
  evidenceJson: z.any().optional(),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return jsonError("Not found", 404);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    const participant = await prisma.programParticipant.findFirst({
      where: { id: parsed.data.participantId, programId },
    });
    if (!participant) return jsonError("Participant not found", 404);

    const record = await prisma.verifiedRecord.create({
      data: {
        participantId: participant.id,
        programId,
        institutionId: program.institutionId,
        title: parsed.data.title,
        summary: parsed.data.summary,
        role: parsed.data.role,
        skillsJson: parsed.data.skillsJson,
        evidenceJson: parsed.data.evidenceJson,
        verificationStatus: "PENDING",
        publicSlug: generatePublicSlug(),
        visibility: parsed.data.visibility ?? "UNLISTED",
      },
    });
    return jsonOk({ record });
  } catch (e) {
    return handleRouteError(e);
  }
}
