import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight text-[color:var(--brand)]">
            BAESH
          </span>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              로그인
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-white hover:opacity-95"
            >
              문의·도입
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <p className="text-sm font-medium text-slate-500">
              B2B SaaS · 기관 중심
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              AI 기반 프로그램 성과관리 및 청년 이력 인증 플랫폼
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
              BAESH는 대학·기관·기업이 운영하는 교육·창업·캡스톤·청년 프로그램의
              참가자 수행 데이터를 자동으로 축적하고, 성과보고서와 검증된 청년
              이력으로 전환합니다. 기관은 관리툴이 아니라 예산 확보에 필요한
              데이터 인프라를 구매합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-md bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
              >
                기관 담당자 로그인
              </Link>
              <a
                href="mailto:hello@baesh.app"
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                도입 문의
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            기관이 겪는 대표 과제
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              증빙자료가 이메일·드라이브·메신저에 흩어져 매년 재수집
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              성과보고서에 넣을 지표가 엑셀·폼에 파편화
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              후속 취업·창업·정주 성과 추적이 어려움
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              담당자 교체 시 운영 노하우와 데이터가 끊김
            </li>
          </ul>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">핵심 기능</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                "프로그램·참가자·팀·출석·과제·제출·피드백·평가",
                "후속성과·증빙 패키지·성과보고서(템플릿 기반)",
                "기관 검증 Verified Profile 및 공개 링크",
              ].map((t) => (
                <div
                  key={t}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} BAESH. All rights reserved.
      </footer>
    </div>
  );
}
