-- CreateTable
CREATE TABLE "KnowledgeCollection" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "KnowledgeCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentVersionId" UUID,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocumentVersion" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "KnowledgeDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEmbedding" (
    "id" UUID NOT NULL,
    "chunkId" UUID NOT NULL,
    "providerKey" TEXT NOT NULL,
    "modelId" UUID NOT NULL,
    "dimension" INTEGER NOT NULL,
    "vector" vector NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeProcessingJob" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "step" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSourceReference" (
    "id" UUID NOT NULL,
    "executionId" UUID,
    "chunkId" UUID NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSourceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAssistantKnowledge" (
    "id" UUID NOT NULL,
    "assistantId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "relevanceThreshold" DOUBLE PRECISION DEFAULT 0.7,
    "maxChunks" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAssistantKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillVersion" (
    "id" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "parameters" JSONB,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillExecution" (
    "id" UUID NOT NULL,
    "skillVersionId" UUID NOT NULL,
    "userId" UUID,
    "input" JSONB,
    "output" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillToolPermission" (
    "id" UUID NOT NULL,
    "skillVersionId" UUID NOT NULL,
    "toolId" UUID NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SkillToolPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeCollection_name_idx" ON "KnowledgeCollection"("name");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_collectionId_idx" ON "KnowledgeDocument"("collectionId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_status_idx" ON "KnowledgeDocument"("status");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_hash_idx" ON "KnowledgeDocument"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDocument_collectionId_hash_key" ON "KnowledgeDocument"("collectionId", "hash");

-- CreateIndex
CREATE INDEX "KnowledgeDocumentVersion_documentId_idx" ON "KnowledgeDocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "KnowledgeDocumentVersion_status_idx" ON "KnowledgeDocumentVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDocumentVersion_documentId_version_key" ON "KnowledgeDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_versionId_idx" ON "KnowledgeChunk"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_versionId_chunkIndex_key" ON "KnowledgeChunk"("versionId", "chunkIndex");

-- CreateIndex
CREATE INDEX "KnowledgeEmbedding_chunkId_idx" ON "KnowledgeEmbedding"("chunkId");

-- CreateIndex
CREATE INDEX "KnowledgeEmbedding_modelId_idx" ON "KnowledgeEmbedding"("modelId");

-- CreateIndex
CREATE INDEX "KnowledgeProcessingJob_versionId_idx" ON "KnowledgeProcessingJob"("versionId");

-- CreateIndex
CREATE INDEX "KnowledgeProcessingJob_status_idx" ON "KnowledgeProcessingJob"("status");

-- CreateIndex
CREATE INDEX "KnowledgeSourceReference_chunkId_idx" ON "KnowledgeSourceReference"("chunkId");

-- CreateIndex
CREATE INDEX "AIAssistantKnowledge_assistantId_idx" ON "AIAssistantKnowledge"("assistantId");

-- CreateIndex
CREATE INDEX "AIAssistantKnowledge_collectionId_idx" ON "AIAssistantKnowledge"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "AIAssistantKnowledge_assistantId_collectionId_key" ON "AIAssistantKnowledge"("assistantId", "collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_key_key" ON "Skill"("key");

-- CreateIndex
CREATE INDEX "SkillVersion_skillId_idx" ON "SkillVersion"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillVersion_skillId_version_key" ON "SkillVersion"("skillId", "version");

-- CreateIndex
CREATE INDEX "SkillExecution_skillVersionId_idx" ON "SkillExecution"("skillVersionId");

-- CreateIndex
CREATE INDEX "SkillExecution_createdAt_idx" ON "SkillExecution"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkillToolPermission_skillVersionId_toolId_key" ON "SkillToolPermission"("skillVersionId", "toolId");

-- AddForeignKey
ALTER TABLE "KnowledgeCollection" ADD CONSTRAINT "KnowledgeCollection_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentVersion" ADD CONSTRAINT "KnowledgeDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "KnowledgeChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeProcessingJob" ADD CONSTRAINT "KnowledgeProcessingJob_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSourceReference" ADD CONSTRAINT "KnowledgeSourceReference_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "KnowledgeChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistantKnowledge" ADD CONSTRAINT "AIAssistantKnowledge_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistantKnowledge" ADD CONSTRAINT "AIAssistantKnowledge_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillVersion" ADD CONSTRAINT "SkillVersion_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillVersion" ADD CONSTRAINT "SkillVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillExecution" ADD CONSTRAINT "SkillExecution_skillVersionId_fkey" FOREIGN KEY ("skillVersionId") REFERENCES "SkillVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillExecution" ADD CONSTRAINT "SkillExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillToolPermission" ADD CONSTRAINT "SkillToolPermission_skillVersionId_fkey" FOREIGN KEY ("skillVersionId") REFERENCES "SkillVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillToolPermission" ADD CONSTRAINT "SkillToolPermission_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AITool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

