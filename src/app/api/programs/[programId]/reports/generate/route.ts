import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { assertProgramWrite } from "@/lib/program-access";
import { generateProgramReport } from "@/lib/services/report-service";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ programId: string }> };

const schema = z.object({
  templateId: z.string().optional().nullable(),
  title: z.string().optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    const { programId } = await ctx.params;
    await assertProgramWrite(me, programId);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return jsonError(parsed.error.message);
    const report = await generateProgramReport({
      programId,
      templateId: parsed.data.templateId,
      generatedById: me.id,
      title: parsed.data.title,
    });
    return jsonOk({ report });
  } catch (e) {
    return handleRouteError(e);
  }
}
