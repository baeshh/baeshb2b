-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PROGRAM_MANAGER', 'MENTOR', 'PARTICIPANT', 'COMPANY_RECRUITER');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('UNIVERSITY', 'PUBLIC_AGENCY', 'COMPANY', 'STARTUP_CENTER', 'LOCAL_GOVERNMENT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProgramCategory" AS ENUM ('EDUCATION', 'STARTUP', 'CAPSTONE', 'HACKATHON', 'INTERNSHIP', 'YOUTH_PROGRAM');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'RECRUITING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('INVITED', 'ACTIVE', 'DROPPED', 'COMPLETED', 'CERTIFIED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('ASSIGNMENT', 'TODO', 'MILESTONE', 'FINAL_OUTPUT', 'SURVEY', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'REVISION_REQUIRED', 'APPROVED');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('GENERAL', 'TASK', 'MENTORING', 'EVALUATION');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('EMPLOYMENT', 'STARTUP', 'LOCAL_SETTLEMENT', 'AWARD', 'NEXT_PROGRAM', 'INVESTMENT', 'NONE');

-- CreateEnum
CREATE TYPE "GeneratedReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('JOB', 'STARTUP_PROGRAM', 'CONTEST', 'MENTORING', 'GOVERNMENT_SUPPORT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('RECOMMENDED', 'SAVED', 'APPLIED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ProgramStaffRole" AS ENUM ('PROGRAM_MANAGER', 'MENTOR');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "institutionId" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "region" TEXT,
    "address" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ProgramCategory" NOT NULL,
    "objective" TEXT,
    "targetParticipants" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "capacity" INTEGER,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramStaff" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProgramStaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramParticipant" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "roleTitle" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "finalScore" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "required" BOOLEAN NOT NULL DEFAULT true,
    "maxScore" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "teamId" TEXT,
    "title" TEXT,
    "content" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "programId" TEXT,
    "taskSubmissionId" TEXT,
    "reportId" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "participantId" TEXT,
    "teamId" TEXT,
    "taskSubmissionId" TEXT,
    "mentorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationRubric" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "criteriaJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "participantId" TEXT,
    "teamId" TEXT,
    "evaluatorId" TEXT NOT NULL,
    "rubricId" TEXT,
    "score" DOUBLE PRECISION,
    "content" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "OutcomeType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationName" TEXT,
    "occurredAt" TIMESTAMP(3),
    "evidenceFileId" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sectionsJson" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedReport" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "metricsJson" JSONB NOT NULL,
    "sectionsJson" JSONB NOT NULL,
    "status" "GeneratedReportStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfFileId" TEXT,
    "generatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "role" TEXT,
    "skillsJson" JSONB,
    "evidenceJson" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publicSlug" TEXT NOT NULL,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'UNLISTED',
    "publicFieldsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationName" TEXT NOT NULL,
    "region" TEXT,
    "requirementsJson" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "institutionId" TEXT,
    "programId" TEXT,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Program_institutionId_idx" ON "Program"("institutionId");

-- CreateIndex
CREATE INDEX "Program_status_idx" ON "Program"("status");

-- CreateIndex
CREATE INDEX "ProgramStaff_userId_idx" ON "ProgramStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramStaff_programId_userId_role_key" ON "ProgramStaff"("programId", "userId", "role");

-- CreateIndex
CREATE INDEX "Team_programId_idx" ON "Team"("programId");

-- CreateIndex
CREATE INDEX "ProgramParticipant_programId_idx" ON "ProgramParticipant"("programId");

-- CreateIndex
CREATE INDEX "ProgramParticipant_userId_idx" ON "ProgramParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramParticipant_programId_userId_key" ON "ProgramParticipant"("programId", "userId");

-- CreateIndex
CREATE INDEX "AttendanceSession_programId_idx" ON "AttendanceSession"("programId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_participantId_idx" ON "AttendanceRecord"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendanceSessionId_participantId_key" ON "AttendanceRecord"("attendanceSessionId", "participantId");

-- CreateIndex
CREATE INDEX "Task_programId_idx" ON "Task"("programId");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_idx" ON "TaskSubmission"("taskId");

-- CreateIndex
CREATE INDEX "TaskSubmission_participantId_idx" ON "TaskSubmission"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_s3Key_key" ON "FileAsset"("s3Key");

-- CreateIndex
CREATE INDEX "FileAsset_institutionId_idx" ON "FileAsset"("institutionId");

-- CreateIndex
CREATE INDEX "FileAsset_taskSubmissionId_idx" ON "FileAsset"("taskSubmissionId");

-- CreateIndex
CREATE INDEX "FileAsset_reportId_idx" ON "FileAsset"("reportId");

-- CreateIndex
CREATE INDEX "Feedback_programId_idx" ON "Feedback"("programId");

-- CreateIndex
CREATE INDEX "Feedback_participantId_idx" ON "Feedback"("participantId");

-- CreateIndex
CREATE INDEX "EvaluationRubric_programId_idx" ON "EvaluationRubric"("programId");

-- CreateIndex
CREATE INDEX "Evaluation_programId_idx" ON "Evaluation"("programId");

-- CreateIndex
CREATE INDEX "Evaluation_participantId_idx" ON "Evaluation"("participantId");

-- CreateIndex
CREATE INDEX "Outcome_programId_idx" ON "Outcome"("programId");

-- CreateIndex
CREATE INDEX "Outcome_participantId_idx" ON "Outcome"("participantId");

-- CreateIndex
CREATE INDEX "ReportTemplate_institutionId_idx" ON "ReportTemplate"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedReport_pdfFileId_key" ON "GeneratedReport"("pdfFileId");

-- CreateIndex
CREATE INDEX "GeneratedReport_programId_idx" ON "GeneratedReport"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedRecord_publicSlug_key" ON "VerifiedRecord"("publicSlug");

-- CreateIndex
CREATE INDEX "VerifiedRecord_programId_idx" ON "VerifiedRecord"("programId");

-- CreateIndex
CREATE INDEX "VerifiedRecord_institutionId_idx" ON "VerifiedRecord"("institutionId");

-- CreateIndex
CREATE INDEX "Recommendation_participantId_idx" ON "Recommendation"("participantId");

-- CreateIndex
CREATE INDEX "Recommendation_opportunityId_idx" ON "Recommendation"("opportunityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_institutionId_idx" ON "AuditLog"("institutionId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramStaff" ADD CONSTRAINT "ProgramStaff_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramStaff" ADD CONSTRAINT "ProgramStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramParticipant" ADD CONSTRAINT "ProgramParticipant_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramParticipant" ADD CONSTRAINT "ProgramParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramParticipant" ADD CONSTRAINT "ProgramParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_taskSubmissionId_fkey" FOREIGN KEY ("taskSubmissionId") REFERENCES "TaskSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "GeneratedReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_taskSubmissionId_fkey" FOREIGN KEY ("taskSubmissionId") REFERENCES "TaskSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRubric" ADD CONSTRAINT "EvaluationRubric_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "EvaluationRubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_pdfFileId_fkey" FOREIGN KEY ("pdfFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedRecord" ADD CONSTRAINT "VerifiedRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedRecord" ADD CONSTRAINT "VerifiedRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedRecord" ADD CONSTRAINT "VerifiedRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedRecord" ADD CONSTRAINT "VerifiedRecord_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ProgramParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
