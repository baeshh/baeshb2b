import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { hashPassword } from "@/lib/auth/password";
import { randomUUID } from "node:crypto";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ programId: string }> };

const rowSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return jsonError("Not found", 404);
    await assertProgramWrite(me, programId);

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);

    let created = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of parsed.data.rows) {
        let user = await tx.user.findUnique({ where: { email: row.email } });
        if (!user) {
          user = await tx.user.create({
            data: {
              email: row.email,
              passwordHash: await hashPassword(randomUUID() + randomUUID()),
              name: row.name,
              phone: row.phone,
              role: "PARTICIPANT",
              institutionId: program.institutionId,
            },
          });
        }
        const exists = await tx.programParticipant.findUnique({
          where: {
            programId_userId: { programId, userId: user.id },
          },
        });
        if (exists) {
          skipped += 1;
          continue;
        }
        await tx.programParticipant.create({
          data: {
            programId,
            userId: user.id,
            status: "INVITED",
            roleTitle: row.roleTitle,
          },
        });
        created += 1;
      }
    });

    await writeAudit({
      userId: me.id,
      institutionId: program.institutionId,
      action: "PARTICIPANTS_IMPORT",
      targetType: "Program",
      targetId: programId,
      metadata: { created, skipped },
    });

    return jsonOk({ created, skipped });
  } catch (e) {
    return handleRouteError(e);
  }
}
