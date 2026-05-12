"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";

type PublicRecord = {
  title: string;
  summary: string | null;
  role: string | null;
  verificationStatus: string;
  participant: { user: { name: string } };
  program: { title: string };
  institution: { name: string };
};

export default function PublicVerifiedRecordPage() {
  const params = useParams<{ publicSlug: string }>();
  const slug = params.publicSlug;

  const q = useQuery({
    queryKey: ["public-verified", slug],
    queryFn: () => apiJson<{ record: PublicRecord }>(`/api/verified-records/${slug}`),
    enabled: Boolean(slug),
    retry: false,
  });

  if (!slug) return null;

  if (q.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        불러오는 중…
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-700">
        인증 기록을 찾을 수 없거나 비공개입니다.
      </div>
    );
  }

  const r = q.data.record;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">{r.institution.name}</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{r.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{r.program.title}</p>
        <p className="mt-4 text-sm text-slate-800">
          <span className="font-medium">{r.participant.user.name}</span>
          {r.role ? <span className="text-slate-600"> · {r.role}</span> : null}
        </p>
        {r.summary ? <p className="mt-4 text-sm leading-relaxed text-slate-700">{r.summary}</p> : null}
        <p className="mt-6 text-xs text-slate-500">
          검증 상태: <span className="font-medium text-slate-800">{r.verificationStatus}</span>
        </p>
      </article>
    </div>
  );
}
