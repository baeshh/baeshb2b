import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAudit(input: {
  userId: string;
  institutionId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        institutionId: input.institutionId ?? undefined,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadataJson: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // 감사 로그 실패가 본 요청을 깨지 않도록
  }
}
