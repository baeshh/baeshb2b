import type { Program, ProgramParticipant } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function getProgramOrThrow(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
  });
  if (!program) throw new HttpError(404, "Program not found");
  return program;
}

export type ProgramAccessContext = {
  program: Program;
  participant?: ProgramParticipant;
};

export async function assertProgramAccess(
  user: SessionUser,
  programId: string,
): Promise<ProgramAccessContext> {
  const program = await getProgramOrThrow(programId);

  if (user.role === "SUPER_ADMIN") {
    return { program };
  }

  if (!user.institutionId || program.institutionId !== user.institutionId) {
    throw new HttpError(403, "Forbidden");
  }

  if (user.role === "INSTITUTION_ADMIN") {
    return { program };
  }

  if (user.role === "PROGRAM_MANAGER") {
    const staff = await prisma.programStaff.findFirst({
      where: {
        programId,
        userId: user.id,
        role: "PROGRAM_MANAGER",
      },
    });
    if (!staff) throw new HttpError(403, "Forbidden");
    return { program };
  }

  if (user.role === "MENTOR") {
    const staff = await prisma.programStaff.findFirst({
      where: { programId, userId: user.id, role: "MENTOR" },
    });
    if (!staff) throw new HttpError(403, "Forbidden");
    return { program };
  }

  if (user.role === "PARTICIPANT") {
    const participant = await prisma.programParticipant.findFirst({
      where: { programId, userId: user.id },
    });
    if (!participant) throw new HttpError(403, "Forbidden");
    return { program, participant };
  }

  if (user.role === "COMPANY_RECRUITER") {
    throw new HttpError(403, "Forbidden");
  }

  throw new HttpError(403, "Forbidden");
}

export async function assertInstitutionAdmin(
  user: SessionUser,
  institutionId: string,
) {
  if (user.role === "SUPER_ADMIN") return;
  if (user.role !== "INSTITUTION_ADMIN") throw new HttpError(403, "Forbidden");
  if (user.institutionId !== institutionId) throw new HttpError(403, "Forbidden");
}

export async function assertProgramWrite(
  user: SessionUser,
  programId: string,
): Promise<ProgramAccessContext> {
  const ctx = await assertProgramAccess(user, programId);
  if (user.role === "PARTICIPANT" || user.role === "MENTOR") {
    throw new HttpError(403, "Forbidden");
  }
  if (user.role === "PROGRAM_MANAGER") return ctx;
  if (user.role === "INSTITUTION_ADMIN") return ctx;
  if (user.role === "SUPER_ADMIN") return ctx;
  throw new HttpError(403, "Forbidden");
}

export async function assertStaffCanModerate(
  user: SessionUser,
  programId: string,
) {
  const program = await getProgramOrThrow(programId);
  if (user.role === "SUPER_ADMIN") return program;
  if (!user.institutionId || user.institutionId !== program.institutionId) {
    throw new HttpError(403, "Forbidden");
  }
  if (user.role === "INSTITUTION_ADMIN") return program;
  if (user.role === "PROGRAM_MANAGER") {
    const s = await prisma.programStaff.findFirst({
      where: { programId, userId: user.id, role: "PROGRAM_MANAGER" },
    });
    if (s) return program;
  }
  if (user.role === "MENTOR") {
    const s = await prisma.programStaff.findFirst({
      where: { programId, userId: user.id, role: "MENTOR" },
    });
    if (s) return program;
  }
  throw new HttpError(403, "Forbidden");
}

export async function assertParticipantRowAccess(
  user: SessionUser,
  programId: string,
  participantId: string,
) {
  const row = await prisma.programParticipant.findFirst({
    where: { id: participantId, programId },
  });
  if (!row) throw new HttpError(404, "Participant not found");

  if (user.role === "PARTICIPANT") {
    const self = await prisma.programParticipant.findFirst({
      where: { programId, userId: user.id },
    });
    if (!self || self.id !== participantId) throw new HttpError(403, "Forbidden");
  } else {
    await assertProgramAccess(user, programId);
  }
  return row;
}
