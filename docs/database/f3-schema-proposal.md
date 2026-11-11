# F3.1 — Propuesta de modelo de datos (borrador, no aplicado)

## Nuevas entidades

### Segment
- id UUID
- name String
- description String?
- criteria Json (tipado, validado con Zod)
- isDynamic Boolean default true
- createdBy String? (User id)
- createdAt, updatedAt, deletedAt

### SegmentParticipant
- id UUID
- segmentId UUID -> Segment
- clientId UUID? -> Client
- contactId UUID? -> Contact
- phoneE164 String? (normalizado)
- snapshot Json (fotografía al momento de ejecución)
- addedAt DateTime

### SegmentExecution
- id UUID
- segmentId UUID -> Segment
- type String (preview/whatsapp_group/chatwoot_team)
- status String (preview/queued/processing/completed/partial/failed/cancelled)
- totalParticipants Int
- eligibleCount Int
- successCount Int
- failCount Int
- idempotencyKey String? @unique
- consentValidated Boolean default false
- snapshot Json?
- startedAt, finishedAt?
- actorId String? -> User
- error String?
- createdAt, updatedAt

### SegmentExecutionResult
- id UUID
- executionId UUID -> SegmentExecution
- participantId UUID? -> SegmentParticipant
- status String (success/failed/skipped)
- externalId String?
- error String?
- createdAt

### WhatsAppGroup
- id UUID
- segmentId UUID? -> Segment
- wahaSession String
- wahaGroupId String (unique)
- name String
- createdBy String? -> User
- createdAt

### WhatsAppGroupMember
- id UUID
- groupId UUID -> WhatsAppGroup
- phoneE164 String
- status String (added/failed/skipped)
- createdAt
- @@unique([groupId, phoneE164])

### ChatwootTeamLink
- id UUID
- localTeamId UUID? -> Team
- chatwootTeamId Int @unique
- name String
- createdAt

### WhatsAppConsent
- id UUID
- contactId UUID? -> Contact
- clientId UUID? -> Client
- phoneE164 String
- purpose String (marketing/commercial/service)
- channel String default "whatsapp"
- status String (granted/revoked)
- capturedAt DateTime
- source String (manual/form/import)
- evidenceReference String?
- revokedAt DateTime?
- createdAt, updatedAt
- @@unique([phoneE164, purpose, channel])

## Relaciones
- Segment 1..* SegmentParticipant
- Segment 1..* SegmentExecution
- SegmentExecution 1..* SegmentExecutionResult
- Segment 0..1 WhatsAppGroup
- WhatsAppGroup 1..* WhatsAppGroupMember
- Team 0..1 ChatwootTeamLink
- Contact/Client 0..* WhatsAppConsent
