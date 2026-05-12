# BAESH B2B

기관 프로그램 성과·증빙·보고서·검증 프로필을 다루는 **Next.js + Prisma** B2B SaaS입니다.

- **랜딩:** `src/app/page.tsx`, `src/app/landing.css` (Pretendard, 프리미엄 마케팅 페이지)
- **저장소:** [github.com/baeshh/baeshb2b](https://github.com/baeshh/baeshb2b)

## 로컬 실행

```bash
cp .env.example .env   # DATABASE_URL, JWT_SECRET 등 설정
npm install
npx prisma migrate deploy
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) — 랜딩, `/login` — 로그인.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run create-test-user` | 로컬 테스트 계정 생성 |

## 환경 변수

`.env.example` 참고. `.env`는 Git에 올리지 마세요.
