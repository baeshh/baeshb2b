"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api-client";

type Me = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    institutionId: string | null;
  };
};

const nav = [
  { href: "/dashboard", label: "기관 대시보드" },
  { href: "/dashboard/programs", label: "프로그램" },
  { href: "/dashboard/opportunities", label: "기회" },
  { href: "/dashboard/settings", label: "설정" },
];

async function fetchSessionUser(): Promise<Me["user"]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await apiJson<Me>("/api/auth/me");
      return r.user;
    } catch (e) {
      lastError = e;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me["user"] | undefined>(undefined);
  const [authPhase, setAuthPhase] = useState<"loading" | "redirecting">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchSessionUser()
      .then((user) => {
        if (!cancelled) setMe(user);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthPhase("redirecting");
          router.replace("/login");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    await apiJson("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  if (me === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-600">
        <p>{authPhase === "redirecting" ? "로그인 페이지로 이동 중…" : "세션 확인 중…"}</p>
        {authPhase === "redirecting" ? (
          <p className="max-w-sm text-xs text-slate-500">
            세션이 없거나 만료되었습니다. 잠시 후 로그인 화면으로 이동합니다.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/dashboard" className="text-sm font-semibold text-[color:var(--brand)]">
            BAESH
          </Link>
          <button
            type="button"
            className="text-xs text-slate-600 underline md:mt-4 md:block"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-4 md:flex-col">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {me.role}
            </p>
            <p className="text-sm font-medium text-slate-900">{me.name}</p>
            <p className="text-xs text-slate-600">{me.email}</p>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
