import { EmptyState } from "@/components/ui/empty-state";

type RecordResponse = {
  record: {
    title: string;
    summary: string | null;
    verificationStatus: string;
    visibility: string;
    participant: { user: { name: string } };
    program: { title: string; startDate: string; endDate: string };
    institution: { name: string };
  };
};

export default async function PublicVerifiedPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/verified-records/${publicSlug}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="프로필을 찾을 수 없습니다" />
      </div>
    );
  }
  const data = (await res.json()) as RecordResponse;
  const r = data.record;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium uppercase text-slate-500">Verified Profile</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{r.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{r.institution.name}</p>
        <p className="mt-1 text-sm text-slate-600">{r.program.title}</p>
        <p className="mt-1 text-xs text-slate-500">
          {new Date(r.program.startDate).toLocaleDateString("ko-KR")} –{" "}
          {new Date(r.program.endDate).toLocaleDateString("ko-KR")}
        </p>
        <p className="mt-6 text-sm text-slate-700">{r.summary}</p>
        <p className="mt-6 text-xs text-slate-500">
          참가자: {r.participant.user.name} · 인증 상태: {r.verificationStatus} · 공개:
          {r.visibility}
        </p>
      </div>
    </div>
  );
}
