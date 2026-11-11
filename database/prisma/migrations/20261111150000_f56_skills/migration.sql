-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "category" TEXT,
ADD COLUMN     "executionMode" TEXT NOT NULL DEFAULT 'disabled',
ADD COLUMN     "maxRetries" INTEGER DEFAULT 0,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "publishedVersionId" UUID,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "timeoutMs" INTEGER DEFAULT 30000;

-- AlterTable
ALTER TABLE "SkillExecution" ADD COLUMN     "approvedAt" TIMESTAMPTZ(6),
ADD COLUMN     "approvedBy" UUID,
ADD COLUMN     "assistantId" UUID,
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "parentExecutionId" UUID,
ADD COLUMN     "ragContextId" UUID,
ADD COLUMN     "toolsUsed" JSONB,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "SkillVersion" ADD COLUMN     "category" TEXT,
ADD COLUMN     "parametersSchema" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMPTZ(6),
ADD COLUMN     "publishedBy" UUID,
ADD COLUMN     "requiredPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- CreateTable
CREATE TABLE "SkillAssistant" (
    "id" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "assistantId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillAssistant_skillId_idx" ON "SkillAssistant"("skillId");

-- CreateIndex
CREATE INDEX "SkillAssistant_assistantId_idx" ON "SkillAssistant"("assistantId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillAssistant_skillId_assistantId_key" ON "SkillAssistant"("skillId", "assistantId");

-- CreateIndex
CREATE INDEX "Skill_status_idx" ON "Skill"("status");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "SkillExecution_assistantId_idx" ON "SkillExecution"("assistantId");

-- CreateIndex
CREATE INDEX "SkillExecution_status_idx" ON "SkillExecution"("status");

-- CreateIndex
CREATE INDEX "SkillVersion_status_idx" ON "SkillVersion"("status");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "SkillVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillVersion" ADD CONSTRAINT "SkillVersion_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillExecution" ADD CONSTRAINT "SkillExecution_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillExecution" ADD CONSTRAINT "SkillExecution_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssistant" ADD CONSTRAINT "SkillAssistant_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssistant" ADD CONSTRAINT "SkillAssistant_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

