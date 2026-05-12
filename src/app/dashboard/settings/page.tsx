"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

type Me = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    institutionId: string | null;
  };
};

type Institution = {
  id: string;
  name: string;
  type: string;
  region: string | null;
  address: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [superInstInput, setSuperInstInput] = useState("");

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => apiJson<Me>("/api/auth/me"),
  });

  const me = meQ.data?.user;
  const isSuper = me?.role === "SUPER_ADMIN";
  const isInstAdmin = me?.role === "INSTITUTION_ADMIN";
  const canEditInst = isSuper || isInstAdmin;

  useEffect(() => {
    const q = searchParams.get("institutionId");
    if (q) setSuperInstInput(q);
  }, [searchParams]);

  const effectiveInstitutionId = me?.institutionId ?? superInstInput.trim() ?? "";

  const instQ = useQuery({
    queryKey: ["institution", effectiveInstitutionId],
    queryFn: () =>
      apiJson<{ institution: Institution }>(`/api/institutions/${effectiveInstitutionId}`),
    enabled: Boolean(effectiveInstitutionId),
  });

  const usersQ = useQuery({
    queryKey: ["institution-users", effectiveInstitutionId],
    queryFn: () =>
      apiJson<{
        items: Array<{ id: string; email: string; name: string; role: string; createdAt: string }>;
      }>(`/api/institutions/${effectiveInstitutionId}/users`),
    enabled: Boolean(effectiveInstitutionId) && (isSuper || isInstAdmin),
  });

  const templatesQ = useQuery({
    queryKey: ["report-templates", effectiveInstitutionId],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; title: string; description: string | null }> }>(
        `/api/institutions/${effectiveInstitutionId}/report-templates`,
      ),
    enabled: Boolean(effectiveInstitutionId),
  });

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    const i = instQ.data?.institution;
    if (!i) return;
    setName(i.name);
    setRegion(i.region ?? "");
    setAddress(i.address ?? "");
    setWebsite(i.website ?? "");
    setContactName(i.contactName ?? "");
    setContactEmail(i.contactEmail ?? "");
    setContactPhone(i.contactPhone ?? "");
  }, [instQ.data?.institution]);

  const [tplTitle, setTplTitle] = useState("");
  const [tplSections, setTplSections] = useState('{"sections":[]}');

  async function saveInstitution() {
    if (!effectiveInstitutionId) return;
    await apiJson(`/api/institutions/${effectiveInstitutionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: name.trim(),
        region: region.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || "",
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      }),
    });
    await qc.invalidateQueries({ queryKey: ["institution", effectiveInstitutionId] });
  }

  async function addTemplate() {
    if (!effectiveInstitutionId || !tplTitle.trim()) return;
    let sectionsJson: unknown;
    try {
      sectionsJson = JSON.parse(tplSections);
    } catch {
      alert("sectionsJson 형식을 확인하세요.");
      return;
    }
    await apiJson(`/api/institutions/${effectiveInstitutionId}/report-templates`, {
      method: "POST",
      body: JSON.stringify({ title: tplTitle.trim(), sectionsJson }),
    });
    setTplTitle("");
    await qc.invalidateQueries({ queryKey: ["report-templates", effectiveInstitutionId] });
  }

  async function deleteTemplate(id: string) {
    if (!confirm("삭제할까요?")) return;
    await apiJson(`/api/report-templates/${id}`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["report-templates", effectiveInstitutionId] });
  }

  if (meQ.isPending) {
    return <p className="text-sm text-slate-600">불러오는 중…</p>;
  }

  if (!me) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-lg font-semibold text-slate-900">설정</h1>

      {isSuper && !me.institutionId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">슈퍼 관리자 · 기관 ID</p>
          <p className="mt-1 text-xs text-slate-600">
            URL에 <code className="rounded bg-slate-100 px-1">?institutionId=...</code> 를 붙이거나 아래에
            입력하세요.
          </p>
          <input
            className="mt-2 w-full rounded border px-2 py-1 font-mono text-sm"
            placeholder="기관 ID (cuid)"
            value={superInstInput}
            onChange={(e) => setSuperInstInput(e.target.value)}
          />
        </div>
      ) : null}

      {!effectiveInstitutionId ? (
        <EmptyState title="기관을 찾을 수 없습니다" />
      ) : instQ.isError ? (
        <p className="text-sm text-red-700">기관 정보를 불러오지 못했습니다.</p>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">기관 정보</h2>
            {!instQ.data ? (
              <p className="text-xs text-slate-500">로딩…</p>
            ) : (
              <>
                <label className="block text-xs text-slate-600">이름</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label className="block text-xs text-slate-600">지역</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
                <label className="block text-xs text-slate-600">주소</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <label className="block text-xs text-slate-600">웹사이트</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <label className="block text-xs text-slate-600">담당자 이름</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <label className="block text-xs text-slate-600">담당자 이메일</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                <label className="block text-xs text-slate-600">담당자 전화</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={!canEditInst}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
                {canEditInst ? (
                  <button
                    type="button"
                    className="rounded bg-[color:var(--brand)] px-3 py-1.5 text-sm text-white"
                    onClick={saveInstitution}
                  >
                    저장
                  </button>
                ) : (
                  <p className="text-xs text-slate-500">기관 정보 수정은 기관 관리자만 가능합니다.</p>
                )}
              </>
            )}
          </section>

          {isSuper || isInstAdmin ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">기관 사용자</h2>
              {!usersQ.data?.items.length ? (
                <EmptyState title="사용자가 없거나 조회 권한이 없습니다" />
              ) : (
                <table className="mt-3 w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-1 pr-2">이름</th>
                      <th className="py-1 pr-2">이메일</th>
                      <th className="py-1">역할</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersQ.data.items.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2">{u.name}</td>
                        <td className="py-1.5 pr-2">{u.email}</td>
                        <td className="py-1.5">{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">보고서 템플릿</h2>
            {!templatesQ.data?.items.length ? (
              <EmptyState title="템플릿이 없습니다" />
            ) : (
              <ul className="divide-y text-sm">
                {templatesQ.data.items.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      {t.description ? (
                        <p className="text-xs text-slate-600">{t.description}</p>
                      ) : null}
                    </div>
                    {canEditInst ? (
                      <button
                        type="button"
                        className="shrink-0 text-xs text-red-700 underline"
                        onClick={() => deleteTemplate(t.id)}
                      >
                        삭제
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canEditInst ? (
              <>
                <p className="text-xs font-medium text-slate-500">새 템플릿</p>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="제목"
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                />
                <textarea
                  className="w-full rounded border px-2 py-1 font-mono text-xs"
                  rows={4}
                  value={tplSections}
                  onChange={(e) => setTplSections(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white"
                  onClick={addTemplate}
                >
                  템플릿 추가
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                템플릿 생성·삭제는 기관 관리자(또는 슈퍼)만 가능합니다. 프로그램 매니저는 목록을 참고해
                보고서를 생성할 수 있습니다.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
