# F4.0 — LLM Gateway: Discovery y diseño

## Arquitectura de componentes

```
┌─────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                  │
│  - Admin: providers, models, assistants              │
│  - Chat/assist panel for operators                  │
└──────────────────────┬──────────────────────────────┘
                       │ REST
┌──────────────────────▼──────────────────────────────┐
│ Backend API (Express)                               │
│  - AI module (controllers, services, repositories)  │
│  - Permission checks (RBAC)                         │
│  - Audit logging                                    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│ LLM Gateway (provider-agnostic)                     │
│  - Provider registry                                │
│  - Model registry                                   │
│  - Assistant registry                               │
│  - Execution engine (chat, stream, tools, json)     │
│  - Retry, timeout, rate limit                       │
│  - Cost tracking                                    │
│  - Context builder (CRM + Chatwoot)                 │
└─────┬──────────┬──────────┬──────────┬──────────────┘
      │          │          │          │
  OpenAI   Anthropic   DeepSeek   OpenAI-compatible
  (HTTPS)  (HTTPS)    (HTTPS)    (HTTPS)
```

## Contratos comunes (TypeScript interfaces)

- `LLMProvider`: { key, name, baseUrl, apiKeyEncrypted, isActive, capabilities }
- `LLMModel`: { key, providerKey, modelId, displayName, capabilities: { chat, stream, tools, json, embeddings, vision }, contextWindow, maxOutputTokens }
- `AIAssistant`: { key, name, description, providerKey, modelKey, systemPrompt, temperature, topP, maxTokens, mode (disabled/assist/approval/auto), humanHandoffPolicy, version, isActive }
- `AIExecution`: { id, assistantKey, conversationRefId?, clientId?, userId?, mode, inputTokens, outputTokens, estimatedCost, latencyMs, status, error, createdAt }
- `AIUsageRecord`: { id, providerKey, modelKey, assistantKey, executionId, inputTokens, outputTokens, cost, createdAt }
- `AITool`: { key, name, description, schema (JSON Schema), handler, requiredPermission }
- `AIAssistantTool`: { assistantKey, toolKey }

## Capacidades por proveedor (documentar diferencias)

| Capacidad | OpenAI | Anthropic | DeepSeek | OpenAI-compat |
|---|---|---|---|---|
| Chat completions | yes | yes | yes | yes (varía) |
| Streaming | yes | yes | yes | varía |
| Tool calling | yes | yes | yes | varía |
| JSON structured output | yes | yes (tool) | yes | varía |
| Embeddings | yes | no | no | varía |
| Visión | yes (gpt-4o) | yes | no | varía |
| Límites de tokens | por modelo | por modelo | por modelo | por modelo |

El gateway debe validar capacidades antes de enviar parámetros no soportados.

## Modos de control humano
1. Disabled: IA desactivada.
2. Assist: solo sugiere respuestas al operador.
3. Approval: IA genera respuesta, requiere aprobación humana.
4. Auto: responde bajo reglas explícitas (no habilitado por defecto).

## Seguridad
- Credenciales cifradas en backend (AES-256-GCM con clave derivada de env `AI_ENCRYPTION_KEY`), nunca expuestas al frontend.
- RBAC: ai.providers.manage, ai.assistants.manage, ai.execute.
- Prompt injection: sanitizar contexto, separar system/user, no permitir override de instrucciones.
- Rate limiting por proveedor/asistente/usuario.
- Límites de consumo (tokens, requests) configurables.
- Auditoría de todas las ejecuciones.
- Herramientas limitadas por permisos.

## Contexto de conversación (integración Chatwoot)
- Identificación: chatwootConversationId, chatwootInboxId, chatwootTeamId, chatwootAssigneeId.
- Contexto CRM: clientId, contactId, tags, notas, última interacción.
- Historial: obtener mensajes desde Chatwoot API (no duplicar en DB propia salvo cache).
- Estado de atención: si operador tomó la conversación, pausar Auto.

## Observabilidad y costos
- Métricas: requests, tokens in/out, costo estimado, latencia, errores.
- Costo: usar costos reportados por proveedor cuando disponibles; estimar con pricing table local cuando no.
- Límites: por proveedor, modelo, asistente, usuario.

## Modelo de datos propuesto (Prisma)

```
model AIProvider {
  id              String   @id @default(uuid()) @db.Uuid
  key             String   @unique
  name            String
  baseUrl         String
  apiKeyEncrypted String
  isActive        Boolean  @default(false)
  capabilities    Json?
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @db.Timestamptz(6)
  models          AIModel[]
}

model AIModel {
  id             String   @id @default(uuid()) @db.Uuid
  providerKey    String
  modelId        String
  displayName    String
  capabilities   Json
  contextWindow  Int?
  maxOutputTokens Int?
  inputPrice     Decimal?  @db.Decimal(18,6)
  outputPrice    Decimal?  @db.Decimal(18,6)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now()) @db.Timestamptz(6)
  provider       AIProvider @relation(fields: [providerKey], references: [key], onDelete: Cascade)
  assistants     AIAssistant[]
  @@unique([providerKey, modelId])
}

model AIAssistant {
  id               String   @id @default(uuid()) @db.Uuid
  key              String   @unique
  name             String
  description      String?
  providerKey      String
  modelKey         String?  // references AIModel.id? use model id
  modelId          String   @db.Uuid
  systemPrompt     String
  temperature      Float?   @default(0.7)
  topP             Float?
  maxTokens        Int?
  mode             String   @default("disabled")
  humanHandoffPolicy Json?
  usageLimits      Json?
  isActive         Boolean  @default(true)
  version          Int      @default(1)
  createdAt        DateTime @default(now()) @db.Timestamptz(6)
  updatedAt        DateTime @updatedAt @db.Timestamptz(6)
  provider         AIProvider @relation(fields: [providerKey], references: [key])
  model            AIModel    @relation(fields: [modelId], references: [id])
  tools            AIAssistantTool[]
  executions       AIExecution[]
}

model AITool {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  name        String
  description String?
  schema      Json
  requiredPermission String?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  assistants  AIAssistantTool[]
}

model AIAssistantTool {
  id          String   @id @default(uuid()) @db.Uuid
  assistantId String   @db.Uuid
  toolId      String   @db.Uuid
  assistant   AIAssistant @relation(fields: [assistantId], references: [id], onDelete: Cascade)
  tool        AITool      @relation(fields: [toolId], references: [id], onDelete: Cascade)
  @@unique([assistantId, toolId])
}

model AIExecution {
  id               String   @id @default(uuid()) @db.Uuid
  assistantId      String   @db.Uuid
  conversationRefId String? @db.Uuid
  clientId         String?  @db.Uuid
  userId           String?  @db.Uuid
  mode             String
  inputTokens      Int      @default(0)
  outputTokens     Int      @default(0)
  estimatedCost    Decimal? @db.Decimal(18,6)
  latencyMs        Int?
  status           String
  error            String?
  createdAt        DateTime @default(now()) @db.Timestamptz(6)
  assistant        AIAssistant @relation(fields: [assistantId], references: [id])
  conversationRef  ConversationReference? @relation(fields: [conversationRefId], references: [id], onDelete: SetNull)
  client           Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)
  user             User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  @@index([assistantId])
  @@index([createdAt])
}

model AIUsageRecord {
  id           String   @id @default(uuid()) @db.Uuid
  providerKey  String
  modelId      String   @db.Uuid
  assistantId  String?  @db.Uuid
  executionId  String?  @db.Uuid
  inputTokens  Int
  outputTokens Int
  cost         Decimal? @db.Decimal(18,6)
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  @@index([providerKey])
  @@index([createdAt])
}

model AIHandoff {
  id               String   @id @default(uuid()) @db.Uuid
  conversationRefId String  @db.Uuid
  fromAssistantId  String?  @db.Uuid
  toUserId         String?  @db.Uuid
  reason           String?
  createdAt        DateTime @default(now()) @db.Timestamptz(6)
  conversationRef  ConversationReference @relation(fields: [conversationRefId], references: [id], onDelete: Cascade)
}

model AIConfiguration {
  id        String   @id @default(uuid()) @db.Uuid
  key       String   @unique
  value     Json
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
}
```

## Plan de implementación F4.1 a F4.7

- F4.1: Modelo de datos + migración + cifrado de credenciales.
- F4.2: LLM Gateway + adaptadores OpenAI/Anthropic/DeepSeek/OpenAI-compat.
- F4.3: Administración de proveedores y modelos (backend + frontend).
- F4.4: Asistentes de IA y herramientas.
- F4.5: Integración con Chatwoot (contexto, sugerencias, aprobación).
- F4.6: Seguridad, costos, observabilidad.
- F4.7: QA, pruebas con mocks, documentación, release.

## Riesgos
- Costos por consumo de APIs pagas → usar mocks en tests, pruebas reales solo bajo acción admin.
- Prompt injection → sanitización y separación de roles.
- Bucles automáticos → límites y detección.
- Diferencias de capacidades entre proveedores → validación previa.

## Criterios de aceptación F4.0
- Arquitectura documentada.
- Modelo de datos propuesto.
- Contratos definidos.
- Plan aprobado.

No se modificó código. Esperar aprobación para F4.1.
