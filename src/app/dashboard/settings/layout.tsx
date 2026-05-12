import { Suspense } from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-slate-600">설정을 불러오는 중…</div>
      }
    >
      {children}
    </Suspense>
  );
}
