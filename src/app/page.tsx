/** 루트(/) 초프리미엄 랜딩 — 스타일은 landing.css */
import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";

export const metadata: Metadata = {
  title: "BAESH - 초프리미엄 AI 성과관리 플랫폼",
  description:
    "대학·기관의 프로그램 데이터를 자동 축적하고 성과보고서·검증 프로필로 전환하는 프리미엄 데이터 인프라.",
};

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="baesh-landing">
      <div className="ambient-light" aria-hidden />

      <nav>
        <div className="logo">BAESH.</div>
        <div className="nav-links">
          <a href="#features">핵심 가치</a>
          <a href="#details">상세 기능</a>
          <a href="mailto:hello@baesh.app">도입 사례</a>
          <Link href="/login" className="btn-premium">
            무료 도입 문의
          </Link>
        </div>
      </nav>

      <section className="hero">
        <h1 className="hero-title">
          성과 데이터, <br />
          <span className="text-gradient">이력이 되고 자산이 되다</span>
        </h1>
        <p className="hero-desc">
          대학과 기관의 프로그램 데이터를 자동으로 축적하고 증명하세요.
          <br />
          파편화된 실적을 모아 완벽한 성과보고서로 전환하는 프리미엄 데이터 인프라.
        </p>

        <div className="scene-container">
          <div className="diorama">
            <div className="panel panel-main">
              <div className="panel-header">
                <div className="dot" />
              </div>
              <div className="panel-body">
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>전체 성과 대시보드</div>
                <div className="data-bar">
                  <div className="data-bar-fill" style={{ width: "85%" }} />
                </div>
                <div className="data-bar">
                  <div
                    className="data-bar-fill"
                    style={{ width: "60%", background: "#7C3AED" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 15, marginTop: 10 }}>
                  <div className="panel panel--nested" style={{ flex: 1, height: 100 }} aria-hidden />
                  <div className="panel panel--nested" style={{ flex: 1, height: 100 }} aria-hidden />
                </div>
              </div>
            </div>

            <div className="panel panel-user-profile">
              <div className="panel-header">
                <div className="dot" />
              </div>
              <div
                className="panel-body"
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#f2f4f6",
                    marginBottom: 20,
                    border: "2px solid #ddd",
                  }}
                  aria-hidden
                />
                <div style={{ fontWeight: 800, fontSize: 18 }}>김영희 참가자</div>
                <div style={{ color: "var(--text-gray)", fontSize: 14, marginBottom: 10 }}>
                  서울대학교 창업동아리
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <div
                    className="panel panel--nested"
                    style={{ padding: "5px 10px", fontSize: 12, fontWeight: 700 }}
                  >
                    Verified
                  </div>
                </div>
              </div>
            </div>

            <div className="panel panel-chart-small">
              <div className="panel-header">
                <div className="dot" />
              </div>
              <div className="panel-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>성과 지표</div>
                  <div style={{ color: "var(--primary-blue)", fontWeight: 700, fontSize: 20 }}>
                    +125%
                  </div>
                </div>
                <div className="chart-bar-container">
                  <div className="chart-bar" style={{ height: "30%" }} />
                  <div className="chart-bar" style={{ height: "60%" }} />
                  <div className="chart-bar" style={{ height: "90%" }} />
                  <div className="chart-bar" style={{ height: "50%" }} />
                  <div className="chart-bar" style={{ height: "80%" }} />
                  <div className="chart-bar" style={{ height: "70%" }} />
                </div>
              </div>
            </div>

            <div className="panel panel-stats">
              <div className="panel-header">
                <div className="dot" />
              </div>
              <div className="panel-body">
                <div style={{ color: "var(--text-gray)", fontSize: 14 }}>총 예산 확보 실적</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#7C3AED" }}>₩ 2.1B</div>
              </div>
            </div>

            <div className="panel panel-globe">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="section-header">
          <span className="section-badge">Why BAESH</span>
          <h2 className="section-title">운영은 가볍게, 성과는 확실하게</h2>
          <p className="section-desc">
            기관 담당자가 겪는 고질적인 데이터 취합의 고통을 영구적으로 해결합니다.
          </p>
        </div>
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
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>데이터 통합 인프라</h3>
            <p>
              흩어진 증빙자료와 실적 데이터를 하나의 통합 워크스페이스에 자동으로 축적하여 매년 반복되는
              재수집 수고를 없앱니다.
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
                strokeWidth="2.5"
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
              축적된 지표와 후속 성과를 바탕으로 클릭 한 번에 기관 맞춤형 템플릿에 맞춘 성과보고서를
              자동 생성합니다.
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
                strokeWidth="2.5"
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
              데이터 기반의 기관 검증 프로필(Verified Profile)을 참가자에게 발급하여 실제 취업 및 창업
              실적으로 연계시킵니다.
            </p>
          </div>
        </div>
      </section>

      <section id="details" className="section">
        <div className="section-header">
          <span className="section-badge">How it works</span>
          <h2 className="section-title">모든 과정이 자연스럽게 데이터가 됩니다</h2>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <h3>엑셀 폼의 늪에서 벗어나세요</h3>
            <p>
              더 이상 메일로 과제를 받고 엑셀로 출석을 체크하지 마세요. 참가자가 BAESH 플랫폼에서
              활동하는 모든 내역(제출, 피드백, 평가)이 즉시 기관의 성과 데이터베이스로 실시간
              매핑됩니다.
            </p>
            <ul className="feature-list">
              <li>분산된 커뮤니케이션 채널 단일화</li>
              <li>참가자/팀 단위 실시간 수행 데이터 트래킹</li>
              <li>히스토리 기반의 데이터 유실 방지</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="mock-window">
              <div className="mock-window-header">
                <div className="mock-dot" style={{ background: "#ff5f56" }} />
                <div className="mock-dot" style={{ background: "#ffbd2e" }} />
                <div className="mock-dot" style={{ background: "#27c93f" }} />
              </div>
              <div className="mock-window-body">
                <div className="mock-skeleton-title" />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 60,
                      background: "var(--primary-blue)",
                      opacity: 0.1,
                      borderRadius: 8,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 60,
                      background: "var(--primary-blue)",
                      opacity: 0.2,
                      borderRadius: 8,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 60,
                      background: "var(--primary-blue)",
                      opacity: 0.4,
                      borderRadius: 8,
                    }}
                  />
                </div>
                <div style={{ marginTop: 20 }}>
                  <div className="mock-skeleton-text" />
                  <div className="mock-skeleton-text short" style={{ marginTop: 10 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <h3>예산 확보를 위한 완벽한 리포트</h3>
            <p>
              다음 해 예산 확보를 위해 밤새워 보고서를 쓰던 시간은 끝났습니다. BAESH의 자동화 엔진이
              수집된 수치적 지표와 후속 성과 증빙 자료를 조합하여, 기관 포맷에 맞는 성과보고서를
              원클릭으로 렌더링합니다.
            </p>
            <ul className="feature-list">
              <li>커스텀 리포트 템플릿 지원 (HWP, PDF)</li>
              <li>정량적/정성적 성과 지표 자동 시각화</li>
              <li>인수인계 없이도 유지되는 성과 도출 시스템</li>
            </ul>
          </div>
          <div
            className="feature-visual"
            style={{
              background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
            }}
          >
            <div
              style={{
                width: 200,
                height: 280,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 15,
                position: "relative",
              }}
            >
              <div style={{ width: "100%", height: 80, background: "#f1f5f9", borderRadius: 4 }} />
              <div style={{ width: "80%", height: 10, background: "#cbd5e1", borderRadius: 2 }} />
              <div style={{ width: "60%", height: 10, background: "#cbd5e1", borderRadius: 2 }} />
              <div
                style={{
                  position: "absolute",
                  bottom: -20,
                  right: -20,
                  width: 60,
                  height: 60,
                  background: "var(--primary-blue)",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                  fontSize: 24,
                  boxShadow: "0 10px 20px rgba(49,130,246,0.3)",
                }}
              >
                ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">업무는 줄어들고, 가치는 증명됩니다</h2>
        <p className="section-desc">BAESH 도입 후 기관들이 경험한 놀라운 변화</p>

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-num">80%</div>
            <div className="stat-label">데이터 취합 업무 시간 단축</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">0건</div>
            <div className="stat-label">담당자 변경 시 데이터 누락</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">3배</div>
            <div className="stat-label">참가자 후속 성과(취·창업) 트래킹 율</div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="logo">BAESH.</div>
        <p>
          © {year} BAESH. B2B SaaS for Institutions. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
