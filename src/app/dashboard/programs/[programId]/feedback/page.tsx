"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Fb = {
  id: string;
  content: string;
  feedbackType: string;
  createdAt: string;
  mentor: { name: string };
};

export default function FeedbackPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [type, setType] = useState("GENERAL");

  const list = useQuery({
    queryKey: ["feedback", programId],
    queryFn: () => apiJson<{ items: Fb[] }>(`/api/programs/${programId}/feedback`),
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

  async function submit() {
    if (!content.trim()) return;
    await apiJson("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        programId,
        participantId: participantId || null,
        content,
        feedbackType: type,
      }),
    });
    setContent("");
    await qc.invalidateQueries({ queryKey: ["feedback", programId] });
  }

  if (!programId) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">피드백 작성</p>
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        >
          <option value="">전체·프로그램 공통</option>
          {(participants.data?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.name}
            </option>
          ))}
        </select>
        <select className="mt-2 w-full rounded border px-2 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          {["GENERAL", "TASK", "MENTORING", "EVALUATION"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <textarea
          rows={4}
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
        />
        <button type="button" className="mt-2 rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white" onClick={submit}>
          등록
        </button>
      </div>

      {!list.data?.items.length ? (
        <EmptyState title="피드백이 없습니다" />
      ) : (
        <ul className="space-y-2">
          {list.data.items.map((f) => (
            <li key={f.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
              <p className="text-xs text-slate-500">
                {f.mentor.name} · {f.feedbackType} · {new Date(f.createdAt).toLocaleString("ko-KR")}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{f.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
