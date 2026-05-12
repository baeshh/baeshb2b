"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    try {
      await apiJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      // 클라이언트 라우팅만 하면 Set-Cookie 직후 세션 요청이 간헐적으로 401이 나 화면이 비는 경우가 있어 전체 이동으로 고정
      window.location.assign("/dashboard");
    } catch (e) {
      form.setError("root", {
        message: e instanceof Error ? e.message : "로그인 실패",
      });
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">로그인</h1>
        <p className="mt-2 text-sm text-slate-600">
          기관 담당자·멘토·참가자 계정으로 로그인합니다.
        </p>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-700">이메일</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">비밀번호</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.root ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full rounded-md bg-[color:var(--brand)] py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "처리 중…" : "로그인"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          초대를 받으셨나요?{" "}
          <Link href="/register" className="text-blue-700 underline">
            회원가입
          </Link>
        </p>
      </div>
      <Link href="/" className="mt-6 text-center text-sm text-slate-600 underline">
        랜딩으로 돌아가기
      </Link>
    </div>
  );
}
