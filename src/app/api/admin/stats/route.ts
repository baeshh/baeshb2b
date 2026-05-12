import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me) return jsonError("Unauthorized", 401);
    if (me.role !== "SUPER_ADMIN") return jsonError("Forbidden", 403);

    const [
      institutions,
      programs,
      participants,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.institution.count(),
      prisma.program.count(),
      prisma.programParticipant.count(),
      prisma.institution.count({
        where: { subscriptionStatus: "ACTIVE" },
      }),
    ]);

    const recentInstitutions = await prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    return jsonOk({
      institutions,
      programs,
      participants,
      activeSubscriptions,
      recentInstitutions,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
