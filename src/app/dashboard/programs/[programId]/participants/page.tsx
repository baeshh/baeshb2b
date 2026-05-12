"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Participant = {
  id: string;
  status: string;
  roleTitle: string | null;
  user: { id: string; email: string; name: string; role: string };
  team: { id: string; name: string } | null;
};

type Team = { id: string; name: string };

const addSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  roleTitle: z.string().optional(),
});

export default function ParticipantsPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");

  const list = useQuery({
    queryKey: ["participants", programId],
    queryFn: () => apiJson<{ items: Participant[] }>(`/api/programs/${programId}/participants`),
    enabled: Boolean(programId),
  });

  const teams = useQuery({
    queryKey: ["teams", programId],
    queryFn: () => apiJson<{ items: Team[] }>(`/api/programs/${programId}/teams`),
    enabled: Boolean(programId),
  });

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: { email: "", name: "", roleTitle: "" },
  });

  async function addOne(data: z.infer<typeof addSchema>) {
    await apiJson(`/api/programs/${programId}/participants`, {
      method: "POST",
      body: JSON.stringify({ ...data, status: "INVITED" }),
    });
    form.reset();
    await qc.invalidateQueries({ queryKey: ["participants", programId] });
  }

  async function inviteStaff(data: { email: string; role: "MENTOR" | "PROGRAM_MANAGER" }) {
    const res = await apiJson<{ token: string; acceptUrl: string }>(
      `/api/programs/${programId}/invites`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    setInviteMsg(`초대 링크가 생성되었습니다. 토큰을 복사해 전달하세요.\n\n${res.acceptUrl}`);
  }

  async function importCsv() {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows: { email: string; name: string }[] = [];
    for (const line of lines) {
      const [email, name] = line.split(",").map((s) => s.trim());
      if (email && name) rows.push({ email, name });
    }
    if (!rows.length) {
      setCsvResult("유효한 CSV 행이 없습니다. 형식: email,name (한 줄에 하나)");
      return;
    }
    const res = await apiJson<{ created: number; skipped: number }>(
      `/api/programs/${programId}/participants/import`,
      { method: "POST", body: JSON.stringify({ rows }) },
    );
    setCsvResult(`추가 ${res.created}명, 건너뜀 ${res.skipped}명`);
    setCsvText("");
    await qc.invalidateQueries({ queryKey: ["participants", programId] });
  }

  async function updateParticipant(
    participantId: string,
    body: { teamId?: string | null; status?: string },
  ) {
    await apiJson(`/api/programs/${programId}/participants/${participantId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    await qc.invalidateQueries({ queryKey: ["participants", programId] });
  }

  if (!programId) return null;
  if (list.isLoading) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-sm font-semibold text-slate-800">참가자 등록</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={form.handleSubmit(addOne)}
          className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="text-xs font-medium text-slate-500">한 명 추가</p>
          <input
            placeholder="이메일"
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            {...form.register("email")}
          />
          <input
            placeholder="이름"
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            {...form.register("name")}
          />
          <input
            placeholder="역할 라벨 (선택)"
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            {...form.register("roleTitle")}
          />
          <button
            type="submit"
            className="rounded bg-[color:var(--brand)] px-3 py-2 text-sm text-white"
          >
            추가
          </button>
        </form>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">CSV 일괄 등록 (email,name)</p>
          <textarea
            rows={5}
            className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
            placeholder={"hong@univ.ac.kr,홍길동\ndu@univ.ac.kr,두산"}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <button
            type="button"
            onClick={importCsv}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            CSV 반영
          </button>
          {csvResult ? <p className="text-xs text-slate-600">{csvResult}</p> : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">멘토·프로그램 담당자 초대</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <InviteRoleButton
            label="멘토 초대 링크 만들기"
            onDone={(email) => inviteStaff({ email, role: "MENTOR" })}
          />
          <InviteRoleButton
            label="담당자 초대 링크 만들기"
            onDone={(email) => inviteStaff({ email, role: "PROGRAM_MANAGER" })}
          />
        </div>
        {inviteMsg ? (
          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">
            {inviteMsg}
          </pre>
        ) : null}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-800">참가자 목록</h2>
        {!list.data?.items.length ? (
          <div className="mt-2">
            <EmptyState title="등록된 참가자가 없습니다" />
          </div>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">팀</th>
                  <th className="px-3 py-2">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.data.items.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2">{p.user.name}</td>
                    <td className="px-3 py-2 text-slate-600">{p.user.email}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                        value={p.status}
                        onChange={(e) =>
                          updateParticipant(p.id, { status: e.target.value })
                        }
                      >
                        {["INVITED", "ACTIVE", "DROPPED", "COMPLETED", "CERTIFIED"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="max-w-[140px] rounded border border-slate-300 px-1 py-0.5 text-xs"
                        value={p.team?.id ?? ""}
                        onChange={(e) =>
                          updateParticipant(p.id, {
                            teamId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">팀 없음</option>
                        {(teams.data?.items ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/dashboard/programs/${programId}/participants/${p.id}`}
                        className="text-blue-800 underline"
                      >
                        보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteRoleButton({
  label,
  onDone,
}: {
  label: string;
  onDone: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        type="email"
        placeholder="초대 이메일"
        className="w-48 rounded border border-slate-300 px-2 py-1 text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="button"
        disabled={loading || !email}
        onClick={async () => {
          setLoading(true);
          try {
            await onDone(email);
          } finally {
            setLoading(false);
          }
        }}
        className="rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? "…" : label}
      </button>
    </div>
  );
}
