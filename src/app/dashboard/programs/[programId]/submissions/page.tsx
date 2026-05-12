"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Row = {
  id: string;
  status: string;
  score: number | null;
  title: string | null;
  task: { id: string; title: string };
  participant: { user: { name: string; email: string } };
};

export default function SubmissionsPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();
  const [sel, setSel] = useState<Row | null>(null);
  const [status, setStatus] = useState("APPROVED");
  const [score, setScore] = useState("");

  const q = useQuery({
    queryKey: ["program-submissions", programId],
    queryFn: () => apiJson<{ items: Row[] }>(`/api/programs/${programId}/submissions`),
    enabled: Boolean(programId),
  });

  async function saveReview() {
    if (!sel) return;
    await apiJson(`/api/submissions/${sel.id}/review`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        score: score === "" ? null : Number.parseFloat(score),
      }),
    });
    setSel(null);
    await qc.invalidateQueries({ queryKey: ["program-submissions", programId] });
  }

  if (!programId) return null;
  if (q.isLoading) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      {!q.data?.items.length ? (
        <EmptyState title="제출물이 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">과제</th>
                <th className="px-3 py-2">참가자</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">검토</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {q.data.items.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.task.title}</td>
                  <td className="px-3 py-2">{r.participant.user.name}</td>
                  <td className="px-3 py-2 text-xs">{r.status}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-blue-800 underline"
                      onClick={() => {
                        setSel(r);
                        setStatus(r.status === "DRAFT" ? "SUBMITTED" : r.status);
                        setScore(r.score != null ? String(r.score) : "");
                      }}
                    >
                      검토
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="font-medium">제출 검토</h3>
            <p className="mt-1 text-xs text-slate-600">
              {sel.task.title} · {sel.participant.user.name}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-600">상태</label>
                <select
                  className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["DRAFT", "SUBMITTED", "REVIEWED", "REVISION_REQUIRED", "APPROVED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600">점수 (선택)</label>
                <input
                  className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white" onClick={saveReview}>
                저장
              </button>
              <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => setSel(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
