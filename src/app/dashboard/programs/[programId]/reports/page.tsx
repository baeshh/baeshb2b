"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type ReportRow = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  template: { id: string; title: string } | null;
  generatedBy: { name: string };
};

export default function ProgramReportsPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();

  const programQ = useQuery({
    queryKey: ["program", programId],
    queryFn: () =>
      apiJson<{ program: { institutionId: string; title: string } }>(
        `/api/programs/${programId}`,
      ),
    enabled: Boolean(programId),
  });

  const instId = programQ.data?.program.institutionId;

  const list = useQuery({
    queryKey: ["program-reports", programId],
    queryFn: () => apiJson<{ items: ReportRow[] }>(`/api/programs/${programId}/reports`),
    enabled: Boolean(programId),
  });

  const templates = useQuery({
    queryKey: ["report-templates", instId],
    queryFn: () => apiJson<{ items: Array<{ id: string; title: string }> }>(
      `/api/institutions/${instId}/report-templates`,
    ),
    enabled: Boolean(instId),
  });

  const [templateId, setTemplateId] = useState("");
  const [genTitle, setGenTitle] = useState("");

  async function generate() {
    await apiJson(`/api/programs/${programId}/reports/generate`, {
      method: "POST",
      body: JSON.stringify({
        templateId: templateId || null,
        title: genTitle.trim() || undefined,
      }),
    });
    setGenTitle("");
    await qc.invalidateQueries({ queryKey: ["program-reports", programId] });
  }

  if (!programId) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">보고서 생성</p>
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">템플릿 없음(기본)</option>
          {(templates.data?.items ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <input
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="보고서 제목 (선택)"
          value={genTitle}
          onChange={(e) => setGenTitle(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white"
          onClick={generate}
        >
          생성
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">생성된 보고서</h3>
        {!list.data?.items.length ? (
          <EmptyState title="보고서가 없습니다" />
        ) : (
          <ul className="mt-2 divide-y rounded border border-slate-200 bg-white text-sm">
            {list.data.items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <div>
                  <Link
                    href={`/dashboard/programs/${programId}/reports/${r.id}`}
                    className="font-medium text-blue-800 underline"
                  >
                    {r.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {r.status} · {r.template?.title ?? "템플릿 없음"} · {r.generatedBy.name}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{r.createdAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
