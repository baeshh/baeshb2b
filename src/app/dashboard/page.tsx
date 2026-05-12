"use client";

import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Me = { user: { role: string; institutionId: string | null } };

type InstitutionMetrics = {
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

type AdminStats = {
  institutions: number;
  programs: number;
  participants: number;
  activeSubscriptions: number;
  recentInstitutions: Array<{
    id: string;
    name: string;
    subscriptionStatus: string;
    createdAt: string;
  }>;
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiJson<Me>("/api/auth/me"),
  });

  const institutionId = meQuery.data?.user.institutionId;
  const role = meQuery.data?.user.role;

  const instMetrics = useQuery({
    queryKey: ["institution-dashboard", institutionId],
    enabled:
      Boolean(institutionId) &&
      role !== "SUPER_ADMIN" &&
      (role === "INSTITUTION_ADMIN" || role === "PROGRAM_MANAGER"),
    queryFn: () =>
      apiJson<{ metrics: InstitutionMetrics }>(
        `/api/institutions/${institutionId}/dashboard`,
      ),
  });

  const adminStats = useQuery({
    queryKey: ["admin-stats"],
    enabled: role === "SUPER_ADMIN",
    queryFn: () => apiJson<AdminStats>("/api/admin/stats"),
  });

  if (meQuery.isLoading) {
    return <p className="text-sm text-slate-600">불러오는 중…</p>;
  }

  if (role === "SUPER_ADMIN") {
    if (adminStats.isLoading) {
      return <p className="text-sm text-slate-600">지표를 불러오는 중…</p>;
    }
    if (!adminStats.data) {
      return (
        <EmptyState title="아직 등록된 데이터가 없습니다" description="통계를 불러오지 못했습니다." />
      );
    }
    const s = adminStats.data;
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-slate-900">Super Admin</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="기관 수" value={s.institutions} />
          <Metric label="프로그램 수" value={s.programs} />
          <Metric label="참가자 수" value={s.participants} />
          <Metric label="활성 구독" value={s.activeSubscriptions} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">최근 가입 기관</h2>
          {s.recentInstitutions.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="아직 등록된 기관이 없습니다" />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {s.recentInstitutions.map((i) => (
                <li key={i.id} className="px-4 py-3 text-sm">
                  <span className="font-medium text-slate-900">{i.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {i.subscriptionStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (!institutionId) {
    return (
      <EmptyState
        title="연결된 기관이 없습니다"
        description="SUPER_ADMIN이 기관을 생성하고 사용자를 배정하면 대시보드가 표시됩니다."
      />
    );
  }

  if (role !== "INSTITUTION_ADMIN" && role !== "PROGRAM_MANAGER") {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">대시보드</h1>
        <p className="text-sm text-slate-600">
          프로그램·설정 등 상단 메뉴에서 이동해 주세요. 기관 집계 대시보드는 기관 관리자·프로그램
          매니저에게만 표시됩니다.
        </p>
      </div>
    );
  }

  if (instMetrics.isLoading) {
    return <p className="text-sm text-slate-600">기관 지표를 불러오는 중…</p>;
  }

  if (!instMetrics.data) {
    return (
      <EmptyState title="지표를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요." />
    );
  }

  const m = instMetrics.data.metrics;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">기관 성과 대시보드</h1>
      <p className="text-sm text-slate-600">
        아래 수치는 모두 데이터베이스에서 집계됩니다. 데이터가 없으면 0으로 표시됩니다.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="운영 중 프로그램" value={m.activePrograms} />
        <Metric label="전체 프로그램" value={m.totalPrograms} />
        <Metric label="전체 참가자" value={m.totalParticipants} />
        <Metric label="평균 과제 제출률(%)" value={m.averageSubmissionRate} />
        <Metric label="총 산출물(제출)" value={m.totalSubmissions} />
        <Metric label="총 피드백" value={m.totalFeedbacks} />
        <Metric label="인증 프로필(검증됨)" value={m.totalVerifiedRecords} />
        <Metric label="후속성과 기록" value={m.totalOutcomes} />
        <Metric label="수료 예상자" value={m.expectedCompletionCount} />
      </div>
    </div>
  );
}
