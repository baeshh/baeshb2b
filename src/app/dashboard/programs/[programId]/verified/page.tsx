"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type RecordRow = {
  id: string;
  title: string;
  summary: string | null;
  verificationStatus: string;
  publicSlug: string;
  visibility: string;
  participant: { user: { name: string } };
};

export default function VerifiedPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();

  const [participantId, setParticipantId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">("UNLISTED");

  const list = useQuery({
    queryKey: ["verified-records", programId],
    queryFn: () => apiJson<{ items: RecordRow[] }>(`/api/programs/${programId}/verified-records`),
    enabled: Boolean(programId),
  });

  const participants = useQuery({
    queryKey: ["participants", programId],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; user: { name: string } }> }>(
        `/api/programs/${programId}/participants`,
      ),
    enabled: Boolean(programId),
  });

  async function create() {
    if (!participantId || !title.trim()) {
      alert("참가자와 제목은 필수입니다.");
      return;
    }
    await apiJson(`/api/programs/${programId}/verified-records`, {
      method: "POST",
      body: JSON.stringify({
        participantId,
        title: title.trim(),
        summary: summary.trim() || undefined,
        visibility,
      }),
    });
    setTitle("");
    setSummary("");
    await qc.invalidateQueries({ queryKey: ["verified-records", programId] });
  }

  async function patchStatus(recordId: string, verificationStatus: "PENDING" | "VERIFIED" | "REVOKED") {
    await apiJson(`/api/programs/${programId}/verified-records/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify({ verificationStatus }),
    });
    await qc.invalidateQueries({ queryKey: ["verified-records", programId] });
  }

  if (!programId) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">인증 기록 생성</p>
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        >
          <option value="">참가자 선택</option>
          {(participants.data?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.name}
            </option>
          ))}
        </select>
        <input
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="요약 (선택)"
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
        >
          <option value="PRIVATE">비공개</option>
          <option value="UNLISTED">링크 소유자만</option>
          <option value="PUBLIC">공개</option>
        </select>
        <button
          type="button"
          className="mt-2 rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white"
          onClick={create}
        >
          생성
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">인증 기록</h3>
        {!list.data?.items.length ? (
          <EmptyState title="인증 기록이 없습니다" />
        ) : (
          <ul className="mt-2 divide-y rounded border border-slate-200 bg-white text-sm">
            {list.data.items.map((r) => (
              <li key={r.id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.participant.user.name} · {r.verificationStatus} · {r.visibility}
                    </p>
                    {r.summary ? <p className="mt-1 text-xs text-slate-600">{r.summary}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => patchStatus(r.id, "VERIFIED")}
                    >
                      검증
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => patchStatus(r.id, "PENDING")}
                    >
                      대기
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => patchStatus(r.id, "REVOKED")}
                    >
                      취소
                    </button>
                  </div>
                </div>
                {r.visibility !== "PRIVATE" ? (
                  <p className="break-all text-xs text-blue-800">
                    공개 페이지: {origin}/v/{r.publicSlug}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
