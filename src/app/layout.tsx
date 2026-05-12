import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BAESH — 기관 성과관리 SaaS",
  description:
    "AI 기반 프로그램 성과관리 및 청년 이력 인증 플랫폼. 기관의 증빙·성과보고·예산 확보를 위한 데이터 인프라.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
