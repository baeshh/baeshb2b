"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Metrics = {
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
  topParticipants: Array<{ participantId: string; name: string; score: number }>;
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function ProgramOverviewPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;

  const metricsQuery = useQuery({
    queryKey: ["program-metrics", programId],
    queryFn: () => apiJson<{ metrics: Metrics }>(`/api/programs/${programId}/dashboard`),
    enabled: Boolean(programId),
  });

  if (!programId) return null;

  if (metricsQuery.isLoading) {
    return <p className="text-sm text-slate-600">지표를 불러오는 중…</p>;
  }

  if (metricsQuery.error || !metricsQuery.data) {
    return <EmptyState title="지표를 불러오지 못했습니다" />;
  }

  const m = metricsQuery.data.metrics;

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-slate-800">운영 지표</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="참가자" value={m.participantCount} />
        <Metric label="팀" value={m.teamCount} />
        <Metric label="출석률(%)" value={m.attendanceRate} />
        <Metric label="과제 수" value={m.taskCount} />
        <Metric label="제출률(%)" value={m.submissionRate} />
        <Metric label="승인 산출물" value={m.approvedSubmissionCount} />
        <Metric label="피드백" value={m.feedbackCount} />
        <Metric label="평가 완료율(%)" value={m.evaluationCompletionRate} />
        <Metric label="수료 예상자" value={m.expectedCompletionCount} />
        <Metric label="Verified" value={m.verifiedRecordCount} />
        <Metric label="후속성과" value={m.outcomeCount} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-800">우수 후보 (점수 기준)</h2>
        {m.topParticipants.length === 0 ? (
          <div className="mt-2">
            <EmptyState title="아직 정리된 점수 데이터가 없습니다" />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
            {m.topParticipants.map((p) => (
              <li key={p.participantId} className="flex justify-between px-4 py-2">
                <span>{p.name}</span>
                <span className="text-slate-600">{p.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
