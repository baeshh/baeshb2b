import { clearAuthCookieOnResponse, getSessionUser } from "@/lib/auth/session";
import { jsonOk, handleRouteError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user) {
      await writeAudit({
        userId: user.id,
        institutionId: user.institutionId,
        action: "USER_LOGOUT",
        targetType: "User",
        targetId: user.id,
      });
    }
    const res = jsonOk({ ok: true });
    clearAuthCookieOnResponse(res);
    return res;
  } catch (e) {
    return handleRouteError(e);
  }
}
