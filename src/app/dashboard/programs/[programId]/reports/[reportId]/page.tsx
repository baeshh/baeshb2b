"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api-client";

type Report = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  sectionsJson: unknown;
  metricsJson: unknown;
  programId: string;
  template: { id: string; title: string } | null;
};

export default function ReportEditPage() {
  const params = useParams<{ programId: string; reportId: string }>();
  const { programId, reportId } = params;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => apiJson<{ report: Report }>(`/api/reports/${reportId}`),
    enabled: Boolean(reportId),
  });

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sectionsText, setSectionsText] = useState("{}");
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => {
    if (!q.data?.report) return;
    const r = q.data.report;
    setTitle(r.title);
    setSummary(r.summary ?? "");
    setSectionsText(JSON.stringify(r.sectionsJson ?? {}, null, 2));
    setStatus(r.status);
  }, [q.data?.report]);

  async function save() {
    let sectionsJson: unknown;
    try {
      sectionsJson = JSON.parse(sectionsText);
    } catch {
      alert("sections JSON 형식이 올바르지 않습니다.");
      return;
    }
    await apiJson(`/api/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: title.trim() || undefined,
        summary: summary.trim() || null,
        sectionsJson,
        status: status as "DRAFT" | "GENERATED" | "EXPORTED",
      }),
    });
    await qc.invalidateQueries({ queryKey: ["report", reportId] });
    await qc.invalidateQueries({ queryKey: ["program-reports", programId] });
  }

  if (!programId || !reportId) return null;

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/programs/${programId}/reports`} className="text-xs text-blue-800 underline">
        ← 보고서 목록
      </Link>
      {!q.data ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-xs text-slate-500">
              템플릿: {q.data.report.template?.title ?? "—"}
            </p>
            <label className="block text-xs font-medium text-slate-600">제목</label>
            <input
              className="w-full rounded border px-2 py-1 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="block text-xs font-medium text-slate-600">요약</label>
            <textarea
              className="w-full rounded border px-2 py-1 text-sm"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <label className="block text-xs font-medium text-slate-600">상태</label>
            <select
              className="w-full rounded border px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["DRAFT", "GENERATED", "EXPORTED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="block text-xs font-medium text-slate-600">sectionsJson</label>
            <textarea
              className="w-full rounded border px-2 py-1 font-mono text-xs"
              rows={16}
              value={sectionsText}
              onChange={(e) => setSectionsText(e.target.value)}
            />
            <button
              type="button"
              className="rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white"
              onClick={save}
            >
              저장
            </button>
          </div>
          <p className="text-xs text-slate-500">
            metricsJson은 생성 시 자동 집계됩니다. 필요 시 별도 API로 확장할 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}
