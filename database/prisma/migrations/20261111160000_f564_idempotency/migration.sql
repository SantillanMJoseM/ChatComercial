-- AlterTable
ALTER TABLE "SkillExecution" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "requestHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SkillExecution_idempotencyKey_key" ON "SkillExecution"("idempotencyKey");

