import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Unauthorized", 401);
    return jsonOk({ user });
  } catch (e) {
    return handleRouteError(e);
  }
}
