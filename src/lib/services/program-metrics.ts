import { prisma } from "@/lib/prisma";

export type ProgramDashboardMetrics = {
  participantCount: number;
  teamCount: number;
  attendanceRate: number;
  taskCount: number;
  submissionRate: number;
  approvedSubmissionCount: number;
  feedbackCount: number;
  evaluationCompletionRate: number;
  expectedCompletionCount: number;
  verifiedRecordCount: number;
  outcomeCount: number;
  topParticipants: Array<{
    participantId: string;
    name: string;
    score: number;
  }>;
};

export async function getProgramDashboardMetrics(
  programId: string,
): Promise<ProgramDashboardMetrics> {
  const [
    participantCount,
    teamCount,
    sessions,
    tasks,
    submissionsSubmitted,
    submissionsApproved,
    feedbackCount,
    evaluations,
    participants,
    verifiedRecordCount,
    outcomeCount,
  ] = await Promise.all([
    prisma.programParticipant.count({ where: { programId } }),
    prisma.team.count({ where: { programId } }),
    prisma.attendanceSession.findMany({
      where: { programId },
      include: { records: true },
    }),
    prisma.task.findMany({
      where: { programId },
      select: { id: true, required: true },
    }),
    prisma.taskSubmission.count({
      where: {
        task: { programId },
        status: { in: ["SUBMITTED", "REVIEWED", "REVISION_REQUIRED", "APPROVED"] },
      },
    }),
    prisma.taskSubmission.count({
      where: { task: { programId }, status: "APPROVED" },
    }),
    prisma.feedback.count({ where: { programId } }),
    prisma.evaluation.findMany({ where: { programId } }),
    prisma.programParticipant.findMany({
      where: { programId },
      include: { user: { select: { name: true } } },
    }),
    prisma.verifiedRecord.count({
      where: { programId, verificationStatus: "VERIFIED" },
    }),
    prisma.outcome.count({ where: { programId } }),
  ]);

  let present = 0;
  let totalSlots = 0;
  for (const s of sessions) {
    const expected = participantCount;
    totalSlots += expected;
    present += s.records.filter((r) =>
      ["PRESENT", "LATE"].includes(r.status),
    ).length;
  }
  const attendanceRate =
    totalSlots > 0 ? Math.round((present / totalSlots) * 1000) / 10 : 0;

  const requiredTasks = tasks.filter((t) => t.required);
  const denom = requiredTasks.length * Math.max(participantCount, 1);
  const submissionRate =
    denom > 0
      ? Math.round((submissionsSubmitted / denom) * 1000) / 10
      : 0;

  const evalParticipants = evaluations.filter((e) => e.participantId).length;
  const evaluationCompletionRate =
    participantCount > 0
      ? Math.min(
          100,
          Math.round((evalParticipants / participantCount) * 1000) / 10,
        )
      : 0;

  const expectedCompletionCount = await prisma.programParticipant.count({
    where: {
      programId,
      status: { in: ["ACTIVE", "COMPLETED", "CERTIFIED"] },
    },
  });

  const scored = participants
    .map((p) => ({
      participantId: p.id,
      name: p.user.name,
      score: p.finalScore ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    participantCount,
    teamCount,
    attendanceRate,
    taskCount: tasks.length,
    submissionRate,
    approvedSubmissionCount: submissionsApproved,
    feedbackCount,
    evaluationCompletionRate,
    expectedCompletionCount,
    verifiedRecordCount,
    outcomeCount,
    topParticipants: scored,
  };
}
