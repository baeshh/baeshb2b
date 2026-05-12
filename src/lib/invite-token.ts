import { createHash } from "node:crypto";
import { nanoid } from "nanoid";

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken() {
  return nanoid(32);
}
