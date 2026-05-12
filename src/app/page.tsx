import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";

export const metadata: Metadata = {
  title: "BAESH - 프리미엄 B2B SaaS",
  description:
    "대학·기관의 프로그램 데이터를 자동 축적하고 성과보고서·검증 프로필로 전환합니다.",
};

export default function LandingPage() {
  return (
    <div className="baesh-landing">
      <nav>
        <div className="logo">BAESH.</div>
        <div className="nav-links">
          <a href="#features">기능 소개</a>
          <a href="mailto:hello@baesh.app">도입 사례</a>
          <Link href="/login">로그인</Link>
          <Link href="/login" className="btn-premium">
            무료로 도입 문의
          </Link>
        </div>
      </nav>

      <section className="hero">
        <h1 className="hero-title">
          기관의 성과 데이터,
          <br />
          <span className="text-gradient">이력이 되고 자산이 되다</span>
        </h1>
        <p className="hero-desc">
          BAESH는 대학과 기관의 프로그램 데이터를 자동으로 축적하고 증명합니다.
          <br />
          엑셀과 폼에 파편화된 데이터를 모아 완벽한 성과보고서로 전환하세요.
        </p>

        <div className="dashboard-wrapper">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dot" />
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar" aria-hidden />
              <div className="mockup-content">
                <div className="mockup-card-top">
                  <div className="mockup-card" aria-hidden />
                  <div className="mockup-card" aria-hidden />
                  <div className="mockup-card" aria-hidden />
                </div>
                <div className="mockup-card" style={{ flex: 1 }} aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <h2 className="section-title">왜 BAESH를 선택해야 할까요?</h2>
        <div className="grid-cards">
          <div className="card">
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>데이터 통합 인프라</h3>
            <p>
              이메일, 드라이브, 메신저 등 곳곳에 흩어진 증빙자료를 하나의 통합 워크스페이스에 자동으로
              축적합니다.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3>성과보고서 자동화</h3>
            <p>
              수집된 핵심 지표와 후속 성과를 바탕으로, 기관 맞춤형 템플릿에 맞춰 깔끔한 보고서를 클릭
              한 번에 생성합니다.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h3>기관 검증 프로필</h3>
            <p>
              프로그램 종료 후에도 성과를 추적하며, 참가자에게 데이터 기반의 기관 검증 프로필(Verified
              Profile)을 발급합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
