"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Session = {
  id: string;
  title: string;
  sessionDate: string;
  records: Array<{ participantId: string; status: string }>;
};

const sessionSchema = z.object({
  title: z.string().min(1),
  sessionDate: z.string().min(1),
});

const recordSchema = z.object({
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
});

export default function AttendancePage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();

  const sessions = useQuery({
    queryKey: ["attendance", programId],
    queryFn: () => apiJson<{ sessions: Session[] }>(`/api/programs/${programId}/attendance`),
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

  const sForm = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { title: "", sessionDate: "" },
  });

  const rForm = useForm<z.infer<typeof recordSchema>>({
    resolver: zodResolver(recordSchema),
    defaultValues: { sessionId: "", participantId: "", status: "PRESENT" },
  });

  async function addSession(data: z.infer<typeof sessionSchema>) {
    await apiJson(`/api/programs/${programId}/attendance/sessions`, {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        sessionDate: new Date(data.sessionDate).toISOString(),
      }),
    });
    sForm.reset();
    await qc.invalidateQueries({ queryKey: ["attendance", programId] });
  }

  async function addRecord(data: z.infer<typeof recordSchema>) {
    await apiJson(`/api/attendance/${data.sessionId}/records`, {
      method: "POST",
      body: JSON.stringify({
        participantId: data.participantId,
        status: data.status,
      }),
    });
    rForm.reset({ sessionId: data.sessionId, participantId: "", status: "PRESENT" });
    await qc.invalidateQueries({ queryKey: ["attendance", programId] });
  }

  if (!programId) return null;

  return (
    <div className="space-y-8">
      <form
        onSubmit={sForm.handleSubmit(addSession)}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="text-xs text-slate-600">회차 제목</label>
          <input className="block rounded border px-2 py-1 text-sm" {...sForm.register("title")} />
        </div>
        <div>
          <label className="text-xs text-slate-600">일시</label>
          <input type="datetime-local" className="block rounded border px-2 py-1 text-sm" {...sForm.register("sessionDate")} />
        </div>
        <button type="submit" className="rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white">
          출석 회차 추가
        </button>
      </form>

      <form
        onSubmit={rForm.handleSubmit(addRecord)}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <div>
          <label className="text-xs text-slate-600">회차</label>
          <select className="mt-1 w-full rounded border px-2 py-1 text-sm" {...rForm.register("sessionId")}>
            <option value="">선택</option>
            {(sessions.data?.sessions ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">참가자</label>
          <select className="mt-1 w-full rounded border px-2 py-1 text-sm" {...rForm.register("participantId")}>
            <option value="">선택</option>
            {(participants.data?.items ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">상태</label>
          <select className="mt-1 w-full rounded border px-2 py-1 text-sm" {...rForm.register("status")}>
            {["PRESENT", "LATE", "ABSENT", "EXCUSED"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded border border-slate-300 py-1.5 text-sm hover:bg-slate-50">
            기록 저장
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-sm font-semibold text-slate-800">회차 목록</h2>
        {!sessions.data?.sessions.length ? (
          <div className="mt-2">
            <EmptyState title="등록된 출석 회차가 없습니다" />
          </div>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border border-slate-200 bg-white text-sm">
            {sessions.data.sessions.map((s) => (
              <li key={s.id} className="flex justify-between px-4 py-3">
                <span className="font-medium">{s.title}</span>
                <span className="text-slate-600">
                  {new Date(s.sessionDate).toLocaleString("ko-KR")} · 기록 {s.records.length}건
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
