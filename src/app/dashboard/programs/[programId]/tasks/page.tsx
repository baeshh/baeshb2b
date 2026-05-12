"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Task = {
  id: string;
  title: string;
  type: string;
  dueDate: string | null;
  required: boolean;
};

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "ASSIGNMENT",
    "TODO",
    "MILESTONE",
    "FINAL_OUTPUT",
    "SURVEY",
    "PRESENTATION",
  ]),
  dueDate: z.string().optional(),
  required: z.boolean().optional(),
});

export default function TasksPage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const qc = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      type: "ASSIGNMENT",
      dueDate: "",
      required: true,
    },
  });

  const q = useQuery({
    queryKey: ["tasks", programId],
    queryFn: () => apiJson<{ items: Task[] }>(`/api/programs/${programId}/tasks`),
    enabled: Boolean(programId),
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    await apiJson(`/api/programs/${programId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      }),
    });
    form.reset({ title: "", description: "", type: "ASSIGNMENT", dueDate: "", required: true });
    await qc.invalidateQueries({ queryKey: ["tasks", programId] });
  }

  async function delTask(id: string) {
    if (!confirm("과제를 삭제할까요?")) return;
    await apiJson(`/api/tasks/${id}`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["tasks", programId] });
  }

  if (!programId) return null;

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <p className="text-xs font-medium text-slate-500">과제 추가</p>
        <input className="w-full rounded border px-2 py-1 text-sm" placeholder="제목" {...form.register("title")} />
        <textarea className="w-full rounded border px-2 py-1 text-sm" placeholder="설명" rows={2} {...form.register("description")} />
        <div className="flex flex-wrap gap-2">
          <select className="rounded border px-2 py-1 text-sm" {...form.register("type")}>
            {["ASSIGNMENT", "TODO", "MILESTONE", "FINAL_OUTPUT", "SURVEY", "PRESENTATION"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input type="datetime-local" className="rounded border px-2 py-1 text-sm" {...form.register("dueDate")} />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" {...form.register("required")} />
            필수
          </label>
        </div>
        <button type="submit" className="rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white">
          저장
        </button>
      </form>

      {!q.data?.items.length ? (
        <EmptyState title="등록된 과제가 없습니다" />
      ) : (
        <ul className="divide-y rounded-lg border border-slate-200 bg-white text-sm">
          {q.data.items.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-medium">{t.title}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {t.type} {t.required ? "· 필수" : ""}
                </span>
              </div>
              <button type="button" className="text-xs text-red-700 underline" onClick={() => delTask(t.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
