"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type FileRow = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export default function EvidencePage() {
  const params = useParams<{ programId: string }>();
  const programId = params.programId;

  const list = useQuery({
    queryKey: ["evidence", programId],
    queryFn: () => apiJson<{ items: FileRow[] }>(`/api/programs/${programId}/evidence`),
    enabled: Boolean(programId),
  });

  async function openFile(fileId: string) {
    try {
      const res = await apiJson<{
        downloadUrl: string | null;
        message?: string;
      }>(`/api/files/${fileId}`);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        alert(res.message ?? "다운로드 URL을 만들 수 없습니다. S3 설정을 확인하세요.");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류");
    }
  }

  if (!programId) return null;

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        이 목록은 프로그램에 직접 연결된 파일, 과제 제출, 성과 증빙으로 연결된 자산을
        모읍니다. 새 업로드는 파일 API(S3 사전서명) 또는 과제 제출 흐름을 사용하세요.
      </p>
      {!list.data?.items.length ? (
        <EmptyState title="표시할 증빙 파일이 없습니다" />
      ) : (
        <ul className="divide-y rounded border border-slate-200 bg-white text-sm">
          {list.data.items.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
              <div>
                <p className="font-medium text-slate-900">{f.originalName}</p>
                <p className="text-xs text-slate-500">
                  {f.mimeType} · {(f.size / 1024).toFixed(1)} KB · {f.createdAt.slice(0, 10)}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-blue-800 underline"
                onClick={() => openFile(f.id)}
              >
                열기
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
