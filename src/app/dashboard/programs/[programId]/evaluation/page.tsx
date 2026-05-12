"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Rubric = { id: string; title: string; description: string | null };
type Ev = {
  id: string;
  score: number | null;
  strengths: string | null;
  improvements: string | null;
  evaluator: { name: string };
  participant: { user: { name: string } } | null;
};

export default function EvaluationPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiJson<{ user: { id: string } }>("/api/auth/me"),
  });

  const [rTitle, setRTitle] = useState("");
  const [rJson, setRJson] = useState('{"criteria":[{"name":"창의성","maxScore":10}]}');

  const [ePid, setEPid] = useState("");
  const [eScore, setEScore] = useState("");
  const [eStr, setEStr] = useState("");
  const [eImp, setEImp] = useState("");
  const [eRubric, setERubric] = useState("");

  const rubricsQ = useQuery({
    queryKey: ["rubrics", programId],
    queryFn: () => apiJson<{ items: Rubric[] }>(`/api/programs/${programId}/rubrics`),
    enabled: Boolean(programId),
  });

  const evals = useQuery({
    queryKey: ["evaluations", programId],
    queryFn: () => apiJson<{ items: Ev[] }>(`/api/programs/${programId}/evaluations`),
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

  async function addRubric() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rJson);
    } catch {
      alert("criteriaJson은 유효한 JSON이어야 합니다.");
      return;
    }
    await apiJson(`/api/programs/${programId}/rubrics`, {
      method: "POST",
      body: JSON.stringify({ title: rTitle, criteriaJson: parsed }),
    });
    setRTitle("");
    await qc.invalidateQueries({ queryKey: ["rubrics", programId] });
  }

  async function addEval() {
    if (!me.data?.user.id) return;
    await apiJson("/api/evaluations", {
      method: "POST",
      body: JSON.stringify({
        programId,
        participantId: ePid || null,
        rubricId: eRubric || null,
        score: eScore === "" ? null : Number.parseFloat(eScore),
        strengths: eStr || undefined,
        improvements: eImp || undefined,
      }),
    });
    setEScore("");
    setEStr("");
    setEImp("");
    await qc.invalidateQueries({ queryKey: ["evaluations", programId] });
  }

  if (!programId) return null;

  const scored = evals.data?.items.filter((e) => e.score != null) ?? [];
  const avgScore =
    scored.length > 0
      ? (scored.reduce((a, e) => a + (e.score ?? 0), 0) / scored.length).toFixed(1)
      : "—";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        평가 건수: {evals.data?.items.length ?? 0} · 평균 점수: {avgScore}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">루브릭 추가</p>
        <input
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="제목"
          value={rTitle}
          onChange={(e) => setRTitle(e.target.value)}
        />
        <textarea
          rows={3}
          className="mt-2 w-full rounded border px-2 py-1 font-mono text-xs"
          value={rJson}
          onChange={(e) => setRJson(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white"
          onClick={addRubric}
        >
          루브릭 저장
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">참가자 평가 입력</p>
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={ePid}
          onChange={(e) => setEPid(e.target.value)}
        >
          <option value="">참가자 미지정</option>
          {(participants.data?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.name}
            </option>
          ))}
        </select>
        <select
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          value={eRubric}
          onChange={(e) => setERubric(e.target.value)}
        >
          <option value="">루브릭 없음</option>
          {(rubricsQ.data?.items ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <input
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="점수"
          value={eScore}
          onChange={(e) => setEScore(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="강점"
          rows={2}
          value={eStr}
          onChange={(e) => setEStr(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
          placeholder="개선점"
          rows={2}
          value={eImp}
          onChange={(e) => setEImp(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded bg-slate-800 px-3 py-1.5 text-sm text-white"
          onClick={addEval}
        >
          평가 저장
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">루브릭 목록</h3>
        {!rubricsQ.data?.items.length ? (
          <EmptyState title="등록된 루브릭이 없습니다" />
        ) : (
          <ul className="mt-2 divide-y rounded border border-slate-200 bg-white text-sm">
            {rubricsQ.data.items.map((r) => (
              <li key={r.id} className="px-4 py-2">
                {r.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">평가 목록</h3>
        {!evals.data?.items.length ? (
          <EmptyState title="평가 기록이 없습니다" />
        ) : (
          <ul className="mt-2 divide-y rounded border border-slate-200 bg-white text-sm">
            {evals.data.items.map((e) => (
              <li key={e.id} className="px-4 py-2">
                <span className="font-medium">{e.participant?.user.name ?? "공통"}</span>
                <span className="ml-2 text-slate-600">점수 {e.score ?? "—"}</span>
                <p className="text-xs text-slate-500">{e.evaluator.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
