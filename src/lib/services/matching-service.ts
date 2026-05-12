import { prisma } from "@/lib/prisma";

type SkillTag = string;

function parseSkills(skillsJson: unknown): SkillTag[] {
  if (!skillsJson) return [];
  if (Array.isArray(skillsJson)) {
    return skillsJson.filter((x): x is string => typeof x === "string");
  }
  if (typeof skillsJson === "object" && skillsJson !== null && "tags" in skillsJson) {
    const t = (skillsJson as { tags?: unknown }).tags;
    if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  }
  return [];
}

function parseRequirementTags(req: unknown): SkillTag[] {
  if (!req || typeof req !== "object") return [];
  const skills = (req as { skills?: unknown }).skills;
  if (Array.isArray(skills)) {
    return skills.filter((x): x is string => typeof x === "string");
  }
  return [];
}

export async function generateRuleBasedRecommendations(participantId: string) {
  const participant = await prisma.programParticipant.findUnique({
    where: { id: participantId },
    include: {
      program: true,
      outcomes: true,
      verifiedRecords: true,
    },
  });
  if (!participant) throw new Error("Participant not found");

  const opportunities = await prisma.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const verified = participant.verifiedRecords.find(
    (v) => v.verificationStatus === "VERIFIED",
  );
  const skills = parseSkills(verified?.skillsJson);

  const rows: Array<{
    participantId: string;
    opportunityId: string;
    score: number;
    reason: string;
  }> = [];

  for (const op of opportunities) {
    let score = 0;
    const reasons: string[] = [];
    const reqTags = parseRequirementTags(op.requirementsJson);

    const overlap = reqTags.filter((t) => skills.includes(t));
    if (overlap.length) {
      score += overlap.length * 10;
      reasons.push(`역량 태그 일치: ${overlap.join(", ")}`);
    }

    if (op.region && participant.program.location?.includes(op.region)) {
      score += 5;
      reasons.push("지역 일치 가중치");
    }

    if (
      participant.program.category === "STARTUP" &&
      op.type === "STARTUP_PROGRAM"
    ) {
      score += 5;
      reasons.push("프로그램 유형과 기회 유형 일치");
    }

    if (participant.outcomes.length === 0 && op.type === "STARTUP_PROGRAM") {
      score += 3;
      reasons.push("후속성과 미기록 — 후속 프로그램 제안");
    }

    if (score > 0) {
      rows.push({
        participantId,
        opportunityId: op.id,
        score,
        reason: reasons.join(" · "),
      });
    }
  }

  rows.sort((a, b) => b.score - a.score);

  await prisma.recommendation.deleteMany({ where: { participantId } });

  if (!rows.length) return [];

  const created = await prisma.$transaction(
    rows.slice(0, 20).map((r) =>
      prisma.recommendation.create({
        data: {
          participantId: r.participantId,
          opportunityId: r.opportunityId,
          score: r.score,
          reason: r.reason,
          status: "RECOMMENDED",
        },
      }),
    ),
  );

  return created;
}
