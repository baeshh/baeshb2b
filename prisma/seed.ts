import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultSections = [
  { key: "overview", title: "프로그램 개요", enabled: true },
  { key: "participants", title: "참가자 현황", enabled: true },
  { key: "attendance", title: "출석 현황", enabled: true },
  { key: "tasks", title: "과제 및 산출물 현황", enabled: true },
  { key: "feedback", title: "멘토링 및 피드백", enabled: true },
  { key: "evaluation", title: "평가 결과", enabled: true },
  { key: "outcomes", title: "후속성과", enabled: true },
  { key: "evidence", title: "증빙자료 목록", enabled: true },
  { key: "summary", title: "종합 성과 요약", enabled: true },
];

async function main() {
  const existing = await prisma.reportTemplate.findFirst({
    where: { institutionId: null, isDefault: true },
  });
  if (!existing) {
    await prisma.reportTemplate.create({
      data: {
        institutionId: null,
        title: "기본 성과보고서 템플릿",
        description: "BAESH 기본 섹션 구성",
        sectionsJson: defaultSections,
        isDefault: true,
      },
    });
  }

  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 12),
          name: "BAESH Super Admin",
          role: "SUPER_ADMIN",
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
