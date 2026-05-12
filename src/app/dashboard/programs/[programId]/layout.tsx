"use client";

import { ProgramHeader, ProgramTabNav } from "@/components/program/program-tab-nav";

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <ProgramHeader />
      <ProgramTabNav />
      <div className="pt-2">{children}</div>
    </div>
  );
}
