CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');
CREATE TYPE "FollowUpKind" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'OTHER');
CREATE TYPE "AiUseCase" AS ENUM ('LEAD_INSIGHT', 'MESSAGE_DRAFT', 'DAILY_BRIEF');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "city" TEXT,
  "industry" TEXT,
  "source" TEXT,
  "valuePaise" INTEGER,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FollowUp" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "kind" "FollowUpKind" NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIResult" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "leadId" TEXT,
  "useCase" "AiUseCase" NOT NULL,
  "model" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIRequest" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "useCase" "AiUseCase" NOT NULL,
  "resultCategory" TEXT NOT NULL,
  "durationMs" INTEGER,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Lead_ownerId_archivedAt_idx" ON "Lead"("ownerId", "archivedAt");
CREATE INDEX "Lead_ownerId_status_idx" ON "Lead"("ownerId", "status");
CREATE INDEX "FollowUp_ownerId_completedAt_dueAt_idx" ON "FollowUp"("ownerId", "completedAt", "dueAt");
CREATE INDEX "FollowUp_leadId_dueAt_idx" ON "FollowUp"("leadId", "dueAt");
CREATE INDEX "AIResult_ownerId_useCase_createdAt_idx" ON "AIResult"("ownerId", "useCase", "createdAt");
CREATE INDEX "AIResult_leadId_useCase_createdAt_idx" ON "AIResult"("leadId", "useCase", "createdAt");
CREATE INDEX "AIRequest_ownerId_createdAt_idx" ON "AIRequest"("ownerId", "createdAt");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIResult" ADD CONSTRAINT "AIResult_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIResult" ADD CONSTRAINT "AIResult_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
