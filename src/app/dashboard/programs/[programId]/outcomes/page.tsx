"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

const OUTCOME_TYPES = [
  "EMPLOYMENT",
  "STARTUP",
  "LOCAL_SETTLEMENT",
  "AWARD",
  "NEXT_PROGRAM",
  "INVESTMENT",
  "NONE",
] as const;

type OutcomeRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  organizationName: string | null;
  occurredAt: string | null;
  verifiedAt: string | null;
  participant: { user: { name: string } } | null;
};

export default function OutcomesPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();

  const [participantId, setParticipantId] = useState("");
  const [type, setType] = useState<(typeof OUTCOME_TYPES)[number]>("EMPLOYMENT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orgName, setOrgName] = useState("");
  const [occurredAt, setOccurredAt] = useState("");

  const list = useQuery({
    queryKey: ["outcomes", programId],
    queryFn: () => apiJson<{ items: OutcomeRow[] }>(`/api/programs/${programId}/outcomes`),
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

  async function add() {
    if (!participantId || !title.trim()) {
      alert("참가자와 제목은 필수입니다.");
      return;
    }
    const body: Record<string, unknown> = {
      participantId,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      organizationName: orgName.trim() || null,
    };
    if (occurredAt) {
      body.occurredAt = new Date(occurredAt).toISOString();
    }
    await apiJson(`/api/programs/${programId}/outcomes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setTitle("");
    setDescription("");
    setOrgName("");
    setOccurredAt("");
    await qc.invalidateQueries({ queryKey: ["outcomes", programId] });
  }

  async function setVerified(outcomeId: string, verified: boolean) {
    await apiJson(`/api/outcomes/${outcomeId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    });
    await qc.invalidateQueries({ queryKey: ["outcomes", programId] });
  }

  if (!programId) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">후속 성과 등록</p>
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
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as (typeof OUTCOME_TYPES)[number])}
        >
          {OUTCOME_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="기관·회사명 (선택)"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="설명 (선택)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="datetime-local"
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white"
          onClick={add}
        >
          저장
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">성과 목록</h3>
        {!list.data?.items.length ? (
          <EmptyState title="등록된 후속 성과가 없습니다" />
        ) : (
          <ul className="mt-2 divide-y rounded border border-slate-200 bg-white text-sm">
            {list.data.items.map((o) => (
              <li key={o.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{o.title}</p>
                  <p className="text-xs text-slate-500">
                    {o.participant?.user.name ?? "—"} · {o.type}
                    {o.organizationName ? ` · ${o.organizationName}` : ""}
                  </p>
                  {o.description ? (
                    <p className="mt-1 text-xs text-slate-600">{o.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    검증: {o.verifiedAt ? `완료 (${o.verifiedAt.slice(0, 10)})` : "미검증"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {o.verifiedAt ? (
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => setVerified(o.id, false)}
                    >
                      검증 취소
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded bg-slate-800 px-2 py-1 text-xs text-white"
                      onClick={() => setVerified(o.id, true)}
                    >
                      검증
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
