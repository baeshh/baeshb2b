import { prisma } from "@/lib/prisma";

export type InstitutionDashboardMetrics = {
  totalPrograms: number;
  activePrograms: number;
  totalParticipants: number;
  totalSubmissions: number;
  averageSubmissionRate: number;
  totalFeedbacks: number;
  totalVerifiedRecords: number;
  totalOutcomes: number;
  expectedCompletionCount: number;
};

export async function getInstitutionDashboardMetrics(
  institutionId: string,
): Promise<InstitutionDashboardMetrics> {
  const programs = await prisma.program.findMany({
    where: { institutionId },
    select: { id: true, status: true },
  });
  const programIds = programs.map((p) => p.id);
  const totalPrograms = programs.length;
  const activePrograms = programs.filter((p) =>
    ["RECRUITING", "ACTIVE"].includes(p.status),
  ).length;

  if (programIds.length === 0) {
    return {
      totalPrograms: 0,
      activePrograms: 0,
      totalParticipants: 0,
      totalSubmissions: 0,
      averageSubmissionRate: 0,
      totalFeedbacks: 0,
      totalVerifiedRecords: 0,
      totalOutcomes: 0,
      expectedCompletionCount: 0,
    };
  }

  const [
    totalParticipants,
    tasks,
    submissions,
    requiredSubmissions,
    totalFeedbacks,
    totalVerifiedRecords,
    totalOutcomes,
    expectedCompletionCount,
  ] = await Promise.all([
    prisma.programParticipant.count({
      where: { programId: { in: programIds } },
    }),
    prisma.task.findMany({
      where: { programId: { in: programIds }, required: true },
      select: { id: true, programId: true },
    }),
    prisma.taskSubmission.count({
      where: {
        task: { programId: { in: programIds } },
        status: { in: ["SUBMITTED", "REVIEWED", "APPROVED"] },
      },
    }),
    prisma.taskSubmission.count({
      where: {
        task: { programId: { in: programIds }, required: true },
        status: { in: ["SUBMITTED", "REVIEWED", "APPROVED"] },
      },
    }),
    prisma.feedback.count({ where: { programId: { in: programIds } } }),
    prisma.verifiedRecord.count({
      where: { institutionId, verificationStatus: "VERIFIED" },
    }),
    prisma.outcome.count({ where: { programId: { in: programIds } } }),
    prisma.programParticipant.count({
      where: {
        programId: { in: programIds },
        status: { in: ["ACTIVE", "CERTIFIED", "COMPLETED"] },
      },
    }),
  ]);

  const requiredTaskIds = tasks.map((t) => t.id);
  const participantsPerProgram = await prisma.programParticipant.groupBy({
    by: ["programId"],
    where: { programId: { in: programIds } },
    _count: { _all: true },
  });
  const participantCountByProgram = new Map(
    participantsPerProgram.map((g) => [g.programId, g._count._all]),
  );

  let denom = 0;
  for (const tid of requiredTaskIds) {
    const task = await prisma.task.findUnique({
      where: { id: tid },
      select: { programId: true },
    });
    if (!task) continue;
    denom += participantCountByProgram.get(task.programId) ?? 0;
  }

  const averageSubmissionRate =
    denom > 0 ? Math.round((requiredSubmissions / denom) * 1000) / 10 : 0;

  return {
    totalPrograms,
    activePrograms,
    totalParticipants,
    totalSubmissions: submissions,
    averageSubmissionRate,
    totalFeedbacks,
    totalVerifiedRecords,
    totalOutcomes,
    expectedCompletionCount,
  };
}
