-- CreateTable
CREATE TABLE "AIProvider" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AIProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModel" (
    "id" UUID NOT NULL,
    "providerKey" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "inputPrice" DECIMAL(18,6),
    "outputPrice" DECIMAL(18,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAssistant" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "providerKey" TEXT NOT NULL,
    "modelKey" TEXT,
    "modelId" UUID NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "topP" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "mode" TEXT NOT NULL DEFAULT 'disabled',
    "humanHandoffPolicy" JSONB,
    "usageLimits" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AIAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITool" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "requiredPermission" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AITool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAssistantTool" (
    "id" UUID NOT NULL,
    "assistantId" UUID NOT NULL,
    "toolId" UUID NOT NULL,

    CONSTRAINT "AIAssistantTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecution" (
    "id" UUID NOT NULL,
    "assistantId" UUID NOT NULL,
    "conversationRefId" UUID,
    "clientId" UUID,
    "userId" UUID,
    "mode" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(18,6),
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageRecord" (
    "id" UUID NOT NULL,
    "providerKey" TEXT NOT NULL,
    "modelId" UUID NOT NULL,
    "assistantId" UUID,
    "executionId" UUID,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cost" DECIMAL(18,6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIHandoff" (
    "id" UUID NOT NULL,
    "conversationRefId" UUID NOT NULL,
    "fromAssistantId" UUID,
    "toUserId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConfiguration" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AIConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_key_key" ON "AIProvider"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AIModel_providerKey_modelId_key" ON "AIModel"("providerKey", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "AIAssistant_key_key" ON "AIAssistant"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AITool_key_key" ON "AITool"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AIAssistantTool_assistantId_toolId_key" ON "AIAssistantTool"("assistantId", "toolId");

-- CreateIndex
CREATE INDEX "AIExecution_assistantId_idx" ON "AIExecution"("assistantId");

-- CreateIndex
CREATE INDEX "AIExecution_createdAt_idx" ON "AIExecution"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageRecord_providerKey_idx" ON "AIUsageRecord"("providerKey");

-- CreateIndex
CREATE INDEX "AIUsageRecord_createdAt_idx" ON "AIUsageRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIConfiguration_key_key" ON "AIConfiguration"("key");

-- AddForeignKey
ALTER TABLE "AIModel" ADD CONSTRAINT "AIModel_providerKey_fkey" FOREIGN KEY ("providerKey") REFERENCES "AIProvider"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistant" ADD CONSTRAINT "AIAssistant_providerKey_fkey" FOREIGN KEY ("providerKey") REFERENCES "AIProvider"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistant" ADD CONSTRAINT "AIAssistant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistantTool" ADD CONSTRAINT "AIAssistantTool_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistantTool" ADD CONSTRAINT "AIAssistantTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AITool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_conversationRefId_fkey" FOREIGN KEY ("conversationRefId") REFERENCES "ConversationReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIHandoff" ADD CONSTRAINT "AIHandoff_conversationRefId_fkey" FOREIGN KEY ("conversationRefId") REFERENCES "ConversationReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

