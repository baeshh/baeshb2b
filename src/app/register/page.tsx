"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiJson } from "@/lib/api-client";

const schema = z.object({
  token: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

type Form = z.infer<typeof schema>;

function RegisterForm() {
  const searchParams = useSearchParams();
  const presetToken = searchParams.get("token") ?? "";
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { token: presetToken },
  });

  async function onSubmit(values: Form) {
    try {
      await apiJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          inviteToken: values.token,
          email: values.email,
          password: values.password,
          name: values.name,
        }),
      });
      window.location.assign("/dashboard");
    } catch (e) {
      form.setError("root", {
        message: e instanceof Error ? e.message : "가입 실패",
      });
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">초대 기반 가입</h1>
      <p className="mt-2 text-sm text-slate-600">
        기관에서 발급한 초대 토큰과 이메일을 사용해 계정을 활성화합니다.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium text-slate-700">초대 토큰</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
            {...form.register("token")}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">이메일</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
            {...form.register("email")}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">이름</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
            {...form.register("name")}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">비밀번호</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
            {...form.register("password")}
          />
          <p className="mt-1 text-xs text-slate-500">8자 이상</p>
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
          가입 완료
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
            불러오는 중…
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
      <Link href="/login" className="mt-6 text-center text-sm text-slate-600 underline">
        로그인으로
      </Link>
    </div>
  );
}
