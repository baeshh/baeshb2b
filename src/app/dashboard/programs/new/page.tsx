"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";

const categories = [
  { value: "EDUCATION", label: "교육" },
  { value: "STARTUP", label: "창업" },
  { value: "CAPSTONE", label: "캡스톤" },
  { value: "HACKATHON", label: "해커톤" },
  { value: "INTERNSHIP", label: "인턴십" },
  { value: "YOUTH_PROGRAM", label: "청년 프로그램" },
] as const;

const schema = z
  .object({
    institutionId: z.string().min(1, "기관을 선택하세요"),
    title: z.string().min(1, "프로그램명을 입력하세요"),
    description: z.string().optional(),
    category: z.enum([
      "EDUCATION",
      "STARTUP",
      "CAPSTONE",
      "HACKATHON",
      "INTERNSHIP",
      "YOUTH_PROGRAM",
    ]),
    objective: z.string().optional(),
    targetParticipants: z.string().optional(),
    startDate: z.string().min(1, "시작일을 선택하세요"),
    endDate: z.string().min(1, "종료일을 선택하세요"),
    capacity: z.string().optional(),
    location: z.string().optional(),
    isOnline: z.boolean(),
  })
  .refine(
    (d) => new Date(d.endDate).getTime() >= new Date(d.startDate).getTime(),
    { message: "종료일은 시작일 이후여야 합니다.", path: ["endDate"] },
  );

type Form = z.infer<typeof schema>;

type Me = { user: { role: string; institutionId: string | null } };
type Institution = { id: string; name: string };

export default function NewProgramPage() {
  const router = useRouter();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiJson<Me>("/api/auth/me"),
  });

  const instQuery = useQuery({
    queryKey: ["institutions"],
    queryFn: () => apiJson<{ items: Institution[] }>("/api/institutions"),
    enabled: meQuery.data?.user.role === "SUPER_ADMIN",
  });

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      institutionId: "",
      title: "",
      description: "",
      category: "EDUCATION",
      objective: "",
      targetParticipants: "",
      startDate: "",
      endDate: "",
      capacity: "",
      location: "",
      isOnline: false,
    },
  });

  useEffect(() => {
    const u = meQuery.data?.user;
    if (u?.role === "INSTITUTION_ADMIN" && u.institutionId) {
      form.setValue("institutionId", u.institutionId);
    }
  }, [meQuery.data, form]);

  async function onSubmit(values: Form) {
    try {
      const cap = values.capacity?.trim();
      const payload = {
        institutionId: values.institutionId,
        title: values.title,
        description: values.description?.trim() || undefined,
        category: values.category,
        objective: values.objective?.trim() || undefined,
        targetParticipants: values.targetParticipants?.trim() || undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        capacity: cap ? Number.parseInt(cap, 10) : undefined,
        location: values.location?.trim() || undefined,
        isOnline: values.isOnline,
        status: "DRAFT" as const,
      };
      const res = await apiJson<{ program: { id: string } }>("/api/programs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/dashboard/programs/${res.program.id}`);
      router.refresh();
    } catch (e) {
      form.setError("root", {
        message: e instanceof Error ? e.message : "저장에 실패했습니다.",
      });
    }
  }

  if (meQuery.isLoading) {
    return <p className="text-sm text-slate-600">불러오는 중…</p>;
  }

  const role = meQuery.data?.user.role;
  if (role !== "SUPER_ADMIN" && role !== "INSTITUTION_ADMIN") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700">
        프로그램 생성은 <strong>기관 관리자</strong> 또는 <strong>슈퍼 관리자</strong>만 할 수
        있습니다.
        <Link href="/dashboard/programs" className="ml-2 text-blue-800 underline">
          목록으로
        </Link>
      </div>
    );
  }

  if (role === "INSTITUTION_ADMIN" && !meQuery.data?.user.institutionId) {
    return (
      <p className="text-sm text-slate-600">
        소속 기관이 없습니다. 슈퍼 관리자에게 계정을 연결해 달라고 요청하세요.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/programs" className="text-xs text-blue-800 underline">
          ← 프로그램 목록
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">새 프로그램 등록</h1>
        <p className="mt-1 text-sm text-slate-600">
          저장 후 상세 페이지에서 참가자·과제 등을 이어서 관리할 수 있습니다.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {role === "SUPER_ADMIN" ? (
          <div>
            <label className="text-sm font-medium text-slate-700">기관</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...form.register("institutionId")}
            >
              <option value="">선택</option>
              {(instQuery.data?.items ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            {form.formState.errors.institutionId ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.institutionId.message}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-slate-700">프로그램명</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...form.register("title")}
          />
          {form.formState.errors.title ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">카테고리</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...form.register("category")}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">설명</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...form.register("description")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">목표</label>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...form.register("objective")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">대상 참가자(안내 문구)</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...form.register("targetParticipants")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">시작일·시간</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...form.register("startDate")}
            />
            {form.formState.errors.startDate ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.startDate.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">종료일·시간</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...form.register("endDate")}
            />
            {form.formState.errors.endDate ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.endDate.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">정원 (선택)</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...form.register("capacity")}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">장소 (선택)</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...form.register("location")}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...form.register("isOnline")} />
          온라인 진행
        </label>

        {form.formState.errors.root ? (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-md bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "저장 중…" : "프로그램 만들기"}
          </button>
          <Link
            href="/dashboard/programs"
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
