-- CreateTable
CREATE TABLE "Segment" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "isDynamic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentParticipant" (
    "id" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "clientId" UUID,
    "contactId" UUID,
    "phoneE164" TEXT,
    "snapshot" JSONB,
    "addedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentExecution" (
    "id" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "consentValidated" BOOLEAN NOT NULL DEFAULT false,
    "snapshot" JSONB,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(6),
    "actorId" UUID,
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SegmentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentExecutionResult" (
    "id" UUID NOT NULL,
    "executionId" UUID NOT NULL,
    "participantId" UUID,
    "status" TEXT NOT NULL,
    "externalId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentExecutionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppGroup" (
    "id" UUID NOT NULL,
    "segmentId" UUID,
    "wahaSession" TEXT NOT NULL,
    "wahaGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppGroupMember" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'added',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatwootTeamLink" (
    "id" UUID NOT NULL,
    "localTeamId" UUID,
    "chatwootTeamId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatwootTeamLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConsent" (
    "id" UUID NOT NULL,
    "contactId" UUID,
    "clientId" UUID,
    "phoneE164" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'granted',
    "capturedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "evidenceReference" TEXT,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WhatsAppConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Segment_name_idx" ON "Segment"("name");

-- CreateIndex
CREATE INDEX "Segment_isDynamic_idx" ON "Segment"("isDynamic");

-- CreateIndex
CREATE INDEX "SegmentParticipant_segmentId_idx" ON "SegmentParticipant"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentParticipant_clientId_idx" ON "SegmentParticipant"("clientId");

-- CreateIndex
CREATE INDEX "SegmentParticipant_contactId_idx" ON "SegmentParticipant"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentExecution_idempotencyKey_key" ON "SegmentExecution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SegmentExecution_segmentId_idx" ON "SegmentExecution"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentExecution_status_idx" ON "SegmentExecution"("status");

-- CreateIndex
CREATE INDEX "SegmentExecution_idempotencyKey_idx" ON "SegmentExecution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SegmentExecutionResult_executionId_idx" ON "SegmentExecutionResult"("executionId");

-- CreateIndex
CREATE INDEX "SegmentExecutionResult_status_idx" ON "SegmentExecutionResult"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppGroup_wahaGroupId_key" ON "WhatsAppGroup"("wahaGroupId");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_segmentId_idx" ON "WhatsAppGroup"("segmentId");

-- CreateIndex
CREATE INDEX "WhatsAppGroupMember_groupId_idx" ON "WhatsAppGroupMember"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppGroupMember_groupId_phoneE164_key" ON "WhatsAppGroupMember"("groupId", "phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "ChatwootTeamLink_chatwootTeamId_key" ON "ChatwootTeamLink"("chatwootTeamId");

-- CreateIndex
CREATE INDEX "ChatwootTeamLink_localTeamId_idx" ON "ChatwootTeamLink"("localTeamId");

-- CreateIndex
CREATE INDEX "WhatsAppConsent_contactId_idx" ON "WhatsAppConsent"("contactId");

-- CreateIndex
CREATE INDEX "WhatsAppConsent_clientId_idx" ON "WhatsAppConsent"("clientId");

-- CreateIndex
CREATE INDEX "WhatsAppConsent_status_idx" ON "WhatsAppConsent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConsent_phoneE164_purpose_channel_key" ON "WhatsAppConsent"("phoneE164", "purpose", "channel");

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentParticipant" ADD CONSTRAINT "SegmentParticipant_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentParticipant" ADD CONSTRAINT "SegmentParticipant_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentParticipant" ADD CONSTRAINT "SegmentParticipant_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentExecution" ADD CONSTRAINT "SegmentExecution_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentExecution" ADD CONSTRAINT "SegmentExecution_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentExecutionResult" ADD CONSTRAINT "SegmentExecutionResult_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "SegmentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentExecutionResult" ADD CONSTRAINT "SegmentExecutionResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SegmentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppGroup" ADD CONSTRAINT "WhatsAppGroup_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppGroup" ADD CONSTRAINT "WhatsAppGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppGroupMember" ADD CONSTRAINT "WhatsAppGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WhatsAppGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatwootTeamLink" ADD CONSTRAINT "ChatwootTeamLink_localTeamId_fkey" FOREIGN KEY ("localTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConsent" ADD CONSTRAINT "WhatsAppConsent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConsent" ADD CONSTRAINT "WhatsAppConsent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

