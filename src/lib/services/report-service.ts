import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getProgramDashboardMetrics } from "@/lib/services/program-metrics";

const DEFAULT_SECTIONS = [
  { key: "overview", title: "프로그램 개요", enabled: true },
  { key: "participants", title: "참가자 현황", enabled: true },
  { key: "attendance", title: "출석 현황", enabled: true },
  { key: "tasks", title: "과제 및 산출물 현황", enabled: true },
  { key: "feedback", title: "멘토링 및 피드백", enabled: true },
  { key: "evaluation", title: "평가 결과", enabled: true },
  { key: "outcomes", title: "후속성과", enabled: true },
  { key: "evidence", title: "증빙자료 목록", enabled: true },
  { key: "summary", title: "종합 성과 요약", enabled: true },
];

export function generatePublicSlug() {
  return nanoid(12);
}

export async function generateProgramReport(input: {
  programId: string;
  templateId?: string | null;
  generatedById: string;
  title?: string;
}) {
  const program = await prisma.program.findUnique({
    where: { id: input.programId },
    include: { institution: true },
  });
  if (!program) throw new Error("Program not found");

  const template =
    (input.templateId &&
      (await prisma.reportTemplate.findFirst({
        where: {
          id: input.templateId,
          OR: [{ institutionId: null }, { institutionId: program.institutionId }],
        },
      }))) ||
    (await prisma.reportTemplate.findFirst({
      where: {
        OR: [
          { institutionId: program.institutionId, isDefault: true },
          { institutionId: null, isDefault: true },
        ],
      },
    }));

  const sectionsSource = (template?.sectionsJson as unknown) ?? DEFAULT_SECTIONS;
  const sectionsJson = Array.isArray(sectionsSource)
    ? sectionsSource
    : DEFAULT_SECTIONS;

  const metrics = await getProgramDashboardMetrics(program.id);

  const evidenceFiles = await prisma.fileAsset.findMany({
    where: { OR: [{ programId: program.id }, { taskSubmission: { task: { programId: program.id } } }] },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });

  const evaluations = await prisma.evaluation.findMany({
    where: { programId: program.id },
    include: { participant: { include: { user: true } } },
  });

  const outcomes = await prisma.outcome.findMany({
    where: { programId: program.id },
  });

  const topParticipants = metrics.topParticipants;

  const metricsJson = {
    ...metrics,
    programTitle: program.title,
    institutionName: program.institution.name,
    category: program.category,
    period: { start: program.startDate, end: program.endDate },
    evidenceCount: evidenceFiles.length,
    evaluationSample: evaluations.slice(0, 20),
    outcomes,
    evidenceFiles,
    topParticipants,
  };

  const title =
    input.title ??
    `${program.title} 성과보고서 (${new Date().toISOString().slice(0, 10)})`;

  const summary = `본 보고서는 ${program.institution.name}의 「${program.title}」 운영 데이터를 기반으로 자동 생성되었습니다.`;

  return prisma.generatedReport.create({
    data: {
      programId: program.id,
      templateId: template?.id,
      title,
      summary,
      metricsJson,
      sectionsJson,
      status: "GENERATED",
      generatedById: input.generatedById,
    },
  });
}
