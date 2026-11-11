# PROJECT_DECISIONS
- D-001: Chatwoot EXTEND as conversation engine.
- D-002: WAHA operational integration for WhatsApp.
- D-003: Single company scope.
- D-004: PostgreSQL 17 + Prisma.
- D-005: Better Auth + RBAC.
- D-006: Docker Compose parallel deploy, ports 3010/4000.
- D-007: Clean Git history, tag v0.1.0-f0.

- D-008: WAHA y Chatwoot son servicios propios de la plataforma, desplegados en el mismo Docker Compose (8 servicios). No son instalaciones externas.
- D-009: cap-postgres (datos propios), cap-cw-db (datos Chatwoot, no administrar directamente), cap-redis (infra propia), cap-cw-redis (infra Chatwoot).
- D-010: Chatwoot es fuente de verdad de conversaciones/mensajes; nuestra app solo mantiene ConversationReference y AssignmentHistory.
- D-011: No crear agentes Chatwoot automáticamente; vinculación manual vía chatwootAgentId.
