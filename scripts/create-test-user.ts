/**
 * 로컬/스테이징용 테스트 계정 생성 (프로덕션에서는 실행하지 마세요)
 *
 * 생성 계정:
 * 1) SUPER_ADMIN — 전역 관리
 * 2) INSTITUTION_ADMIN — 데모 기관 소속 (기관 대시보드·프로그램 생성 테스트용)
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const PASSWORD = "BaeshTest123!";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);

  const superEmail = "super@test.baesh";
  let superUser = await prisma.user.findUnique({ where: { email: superEmail } });
  if (!superUser) {
    superUser = await prisma.user.create({
      data: {
        email: superEmail,
        passwordHash: hash,
        name: "테스트 슈퍼관리자",
        role: "SUPER_ADMIN",
      },
    });
    console.log("생성:", superEmail);
  } else {
    await prisma.user.update({
      where: { id: superUser.id },
      data: { passwordHash: hash },
    });
    console.log("비밀번호 갱신:", superEmail);
  }

  const instName = "데모 테스트 기관";
  let institution = await prisma.institution.findFirst({
    where: { name: instName },
  });
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        name: instName,
        type: "UNIVERSITY",
        region: "서울",
        subscriptionStatus: "ACTIVE",
      },
    });
    console.log("기관 생성:", instName, institution.id);
  }

  const adminEmail = "admin@test.baesh";
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        name: "테스트 기관관리자",
        role: "INSTITUTION_ADMIN",
        institutionId: institution.id,
      },
    });
    console.log("생성:", adminEmail, "→ 기관:", institution.name);
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: hash,
        institutionId: institution.id,
        role: "INSTITUTION_ADMIN",
      },
    });
    console.log("갱신:", adminEmail, "→ 기관:", institution.name);
  }

  console.log("\n── 로그인 정보 (공통 비밀번호) ──");
  console.log("비밀번호:", PASSWORD);
  console.log("");
  console.log("[슈퍼관리자]", superEmail);
  console.log("[기관관리자]", adminEmail);
  console.log("");
  console.log("http://localhost:3000/login 에서 위 이메일로 로그인하세요.");
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
