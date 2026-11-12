-- AlterTable
ALTER TABLE "AIProvider" ADD COLUMN     "lastCheckedAt" TIMESTAMPTZ(6),
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastLatencyMs" INTEGER,
ADD COLUMN     "lastModel" TEXT,
ADD COLUMN     "lastSuccessAt" TIMESTAMPTZ(6),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'not_checked';

