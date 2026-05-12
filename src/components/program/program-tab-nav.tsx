"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";

const TABS = [
  { suffix: "", label: "개요" },
  { suffix: "participants", label: "참가자" },
  { suffix: "teams", label: "팀" },
  { suffix: "attendance", label: "출석" },
  { suffix: "tasks", label: "과제" },
  { suffix: "submissions", label: "제출물" },
  { suffix: "feedback", label: "피드백" },
  { suffix: "evaluation", label: "평가" },
  { suffix: "outcomes", label: "후속성과" },
  { suffix: "reports", label: "성과보고서" },
  { suffix: "evidence", label: "증빙" },
  { suffix: "verified", label: "인증기록" },
] as const;

export function ProgramTabNav() {
  const params = useParams<{ programId: string }>();
  const pathname = usePathname();
  const programId = params.programId;
  const base = `/dashboard/programs/${programId}`;

  return (
    <nav className="-mx-1 flex flex-wrap gap-1 border-b border-slate-200 pb-px">
      {TABS.map((tab) => {
        const href = tab.suffix ? `${base}/${tab.suffix}` : base;
        const active =
          tab.suffix === ""
            ? pathname === base
            : pathname.startsWith(`${base}/${tab.suffix}`);
        return (
          <Link
            key={tab.suffix || "overview"}
            href={href}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              active
                ? "border border-b-0 border-slate-200 bg-white text-slate-900"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ProgramHeader() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;
  const q = useQuery({
    queryKey: ["program", programId],
    queryFn: () =>
      apiJson<{
        program: { title: string; institution: { name: string }; description: string | null };
      }>(`/api/programs/${programId}`),
    enabled: Boolean(programId),
  });

  if (!programId) return null;

  return (
    <div className="mb-4">
      <Link href="/dashboard/programs" className="text-xs text-blue-800 underline">
        ← 프로그램 목록
      </Link>
      {q.data ? (
        <>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">{q.data.program.title}</h1>
          <p className="text-sm text-slate-600">{q.data.program.institution.name}</p>
          {q.data.program.description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-700">{q.data.program.description}</p>
          ) : null}
        </>
      ) : (
        <h1 className="mt-2 text-xl font-semibold text-slate-400">프로그램</h1>
      )}
    </div>
  );
}
