"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

export default function ParticipantDetailPage() {
  const params = useParams<{ programId: string; participantId: string }>();
  const { programId, participantId } = params;

  const q = useQuery({
    queryKey: ["participant", programId, participantId],
    queryFn: () =>
      apiJson<{
        participant: {
          status: string;
          roleTitle: string | null;
          user: { email: string; name: string };
          team: { name: string } | null;
          attendanceRecords: Array<{ status: string; session: { title: string; sessionDate: string } }>;
          taskSubmissions: Array<{
            status: string;
            title: string | null;
            task: { title: string };
          }>;
          feedbacks: Array<{ content: string; createdAt: string }>;
          evaluations: Array<{ score: number | null; strengths: string | null; createdAt: string }>;
          outcomes: Array<{ type: string; title: string }>;
          verifiedRecords: Array<{ title: string; verificationStatus: string; publicSlug: string }>;
        };
      }>(`/api/programs/${programId}/participants/${participantId}`),
    enabled: Boolean(programId && participantId),
  });

  if (!programId || !participantId) return null;
  if (q.isLoading) return <p className="text-sm text-slate-600">불러오는 중…</p>;
  if (q.error || !q.data) return <EmptyState title="참가자 정보를 불러올 수 없습니다" />;

  const p = q.data.participant;

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/programs/${programId}/participants`}
        className="text-xs text-blue-800 underline"
      >
        ← 참가자 목록
      </Link>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{p.user.name}</h2>
        <p className="text-sm text-slate-600">{p.user.email}</p>
        <p className="mt-1 text-xs text-slate-500">
          상태: {p.status} · 팀: {p.team?.name ?? "—"} · 역할: {p.roleTitle ?? "—"}
        </p>
      </div>

      <Section title="출석">
        {p.attendanceRecords.length === 0 ? (
          <EmptyState title="출석 기록 없음" />
        ) : (
          <ul className="divide-y rounded border border-slate-200 bg-white text-sm">
            {p.attendanceRecords.map((r, i) => (
              <li key={i} className="flex justify-between px-3 py-2">
                <span>{r.session.title}</span>
                <span className="text-slate-600">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="과제 제출">
        {p.taskSubmissions.length === 0 ? (
          <EmptyState title="제출물 없음" />
        ) : (
          <ul className="divide-y rounded border border-slate-200 bg-white text-sm">
            {p.taskSubmissions.map((s, i) => (
              <li key={i} className="px-3 py-2">
                <span className="font-medium">{s.task.title}</span>
                <span className="ml-2 text-xs text-slate-500">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="피드백">
        {p.feedbacks.length === 0 ? (
          <EmptyState title="피드백 없음" />
        ) : (
          <ul className="space-y-2 text-sm">
            {p.feedbacks.map((f, i) => (
              <li key={i} className="rounded border border-slate-200 bg-white p-3">
                {f.content}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="평가">
        {p.evaluations.length === 0 ? (
          <EmptyState title="평가 없음" />
        ) : (
          <ul className="divide-y rounded border border-slate-200 bg-white text-sm">
            {p.evaluations.map((e, i) => (
              <li key={i} className="px-3 py-2">
                점수: {e.score ?? "—"} · {e.strengths ?? ""}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="후속성과">
        {p.outcomes.length === 0 ? (
          <EmptyState title="기록 없음" />
        ) : (
          <ul className="divide-y rounded border border-slate-200 bg-white text-sm">
            {p.outcomes.map((o, i) => (
              <li key={i} className="px-3 py-2">
                [{o.type}] {o.title}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Verified 기록">
        {p.verifiedRecords.length === 0 ? (
          <EmptyState title="인증 기록 없음" />
        ) : (
          <ul className="divide-y rounded border border-slate-200 bg-white text-sm">
            {p.verifiedRecords.map((v) => (
              <li key={v.publicSlug} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span>{v.title}</span>
                <span className="text-xs text-slate-500">{v.verificationStatus}</span>
                <a
                  className="text-xs text-blue-800 underline"
                  href={`/p/${v.publicSlug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  공개 링크
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
