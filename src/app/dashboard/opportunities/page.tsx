import { EmptyState } from "@/components/ui/empty-state";

export default function OpportunitiesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">기회 · 채용 연계</h1>
      <EmptyState title="준비 중입니다" />
      <p className="text-sm text-slate-600">
        기업 리크루터와 연계된 포지션·지원 현황은 이후 스프린트에서 이 탭에 모입니다.
      </p>
    </div>
  );
}
