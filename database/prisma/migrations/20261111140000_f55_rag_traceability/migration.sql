-- AlterTable
ALTER TABLE "AIExecution" ADD COLUMN     "abstained" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contextId" UUID,
ADD COLUMN     "evidenceStatus" TEXT,
ADD COLUMN     "handoffReason" TEXT,
ADD COLUMN     "queryText" TEXT;

-- CreateTable
CREATE TABLE "AIRagFeedback" (
    "id" UUID NOT NULL,
    "executionId" UUID NOT NULL,
    "userId" UUID,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRagFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIRagFeedback_executionId_idx" ON "AIRagFeedback"("executionId");

-- CreateIndex
CREATE INDEX "AIRagFeedback_createdAt_idx" ON "AIRagFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "AIRagFeedback" ADD CONSTRAINT "AIRagFeedback_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AIExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRagFeedback" ADD CONSTRAINT "AIRagFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

