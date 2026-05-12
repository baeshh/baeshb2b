"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Program = {
  id: string;
  title: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  institution: { id: string; name: string };
};

export default function ProgramsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiJson<{ items: Program[] }>("/api/programs"),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-600">불러오는 중…</p>;
  }

  if (error) {
    return (
      <EmptyState
        title="프로그램 목록을 불러오지 못했습니다"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">프로그램</h1>
          <p className="text-sm text-slate-600">
            검색·필터는 API 쿼리스트링으로 확장할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/programs/new"
            className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            새 프로그램
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <>
          <EmptyState
            title="아직 등록된 프로그램이 없습니다"
            description="아래 버튼으로 프로그램을 만들 수 있습니다."
          />
          <div className="flex justify-center">
            <Link
              href="/dashboard/programs/new"
              className="rounded-md bg-[color:var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              새 프로그램 만들기
            </Link>
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">기관</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">카테고리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link
                      href={`/dashboard/programs/${p.id}`}
                      className="text-blue-800 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.institution.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.status}</td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
