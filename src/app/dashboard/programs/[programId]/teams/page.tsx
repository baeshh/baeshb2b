"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Team = { id: string; name: string; description: string | null; _count: { participants: number } };

const schema = z.object({ name: z.string().min(1), description: z.string().optional() });

export default function TeamsPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const q = useQuery({
    queryKey: ["teams", programId],
    queryFn: () => apiJson<{ items: Team[] }>(`/api/programs/${programId}/teams`),
    enabled: Boolean(programId),
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    await apiJson(`/api/programs/${programId}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    form.reset();
    await qc.invalidateQueries({ queryKey: ["teams", programId] });
  }

  async function removeTeam(id: string) {
    if (!confirm("팀을 삭제할까요?")) return;
    await apiJson(`/api/programs/${programId}/teams/${id}`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["teams", programId] });
  }

  if (!programId) return null;
  if (q.isLoading) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="text-xs text-slate-600">팀 이름</label>
          <input className="block rounded border border-slate-300 px-2 py-1 text-sm" {...form.register("name")} />
        </div>
        <div>
          <label className="text-xs text-slate-600">설명</label>
          <input className="block rounded border border-slate-300 px-2 py-1 text-sm" {...form.register("description")} />
        </div>
        <button type="submit" className="rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white">
          팀 추가
        </button>
      </form>

      {!q.data?.items.length ? (
        <EmptyState title="등록된 팀이 없습니다" />
      ) : (
        <ul className="divide-y rounded-lg border border-slate-200 bg-white text-sm">
          {q.data.items.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-medium">{t.name}</span>
                <span className="ml-2 text-xs text-slate-500">참가자 {t._count.participants}명</span>
                {t.description ? <p className="text-xs text-slate-600">{t.description}</p> : null}
              </div>
              <button
                type="button"
                className="text-xs text-red-700 underline"
                onClick={() => removeTeam(t.id)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
