# F6.0 — Diseño de Automatizaciones Comerciales y Reportes

## 1. Inventario de componentes reutilizables
- Eventos: OutboxMessage, IntegrationEvent (WAHA/Chatwoot webhooks).
- Colas: BullMQ (outbox, webhooks, documents, embeddings).
- Adaptadores: WAHA, Chatwoot.
- CRM: Client, Contact, Team, OperatorProfile.
- Segmentaciones: Segment, SegmentExecution.
- IA: AIAssistant, GroundedGenerationService, RetrievalService, ContextBuilder.
- Skills: Skill, SkillVersion, SkillExecution, SkillRuntime.
- Auditoría: AuditLog, IntegrationEvent.
- Auth/RBAC: User, Role, Permission.

## 2. Arquitectura propuesta
```
Event Sources (webhooks, cron, manual)
  → Event Bus (Outbox + BullMQ)
    → Automation Engine (rule evaluation, conditions)
      → Action Executor (catalog of actions)
        → Adapters (WAHA, Chatwoot, CRM, Skills, AI)
      → Execution Log + Audit
```

## 3. Modelo de datos propuesto (nuevas entidades)
- Automation (id, name, description, category, status draft/published/disabled, version, createdBy, createdAt, updatedAt, deletedAt)
- AutomationVersion (id, automationId, version, trigger Json, conditions Json, actions Json, createdBy, createdAt, publishedAt)
- AutomationTrigger (id, automationId, type, config Json, createdAt)
- AutomationExecution (id, automationId, versionId, status, triggerEvent Json, startedAt, finishedAt, error, idempotencyKey unique)
- AutomationExecutionStep (id, executionId, stepIndex, type, status, input, output, error, startedAt, finishedAt)
- AutomationApproval (id, executionId, stepId, status, requestedBy, approvedBy, approvedAt, reason, expiresAt)
- AutomationSchedule (id, automationId, cron, timezone, nextRunAt, isActive)
- AutomationLog (id, executionId, level, message, createdAt)
- ReportDefinition (id, name, description, query Json, filters Json, createdBy, createdAt)
- ReportExecution (id, reportId, status, params Json, result Json, startedAt, finishedAt, createdBy)
- Notification (id, userId, type, title, body, read, createdAt)

Reutilizar User, Team, Client, ConversationReference, Skill, etc.

## 4. Catálogo de triggers
- client.created, client.updated, client.inactive
- contact.created
- conversation.created, conversation.status_changed, conversation.assigned, conversation.resolved, conversation.reopened, conversation.unanswered
- message.received (whatsapp)
- whatsapp.group.created, segment.created
- skill.executed, handoff.created
- scheduled (cron)
- manual

## 5. Condiciones
- Tipadas con Zod, combinables (and/or).
- Campos: client.status, client.tags, client.origin, client.teamId, conversation.status, conversation.priority, timeSinceLastActivity, businessHours, etc.
- No SQL arbitrario.

## 6. Acciones
- create_task, assign_operator, assign_team, change_conversation_status, add/remove_tag, create_note, update_client, execute_skill, query_rag, request_ai_assistance, handoff, send_whatsapp, send_notification, add_to_segment, generate_report, wait.
- Acciones externas usan adaptadores existentes.

## 7. Seguridad y aprobación
- Clasificación de riesgo: read/internal_write/external_action/massive.
- AUTO no por defecto para acciones externas.
- Consentimiento WhatsApp validado.
- Rate limiting, idempotencia, auditoría.

## 8. Motor de ejecución
- Event-driven, BullMQ, Outbox.
- Idempotencia por execution idempotencyKey.
- Reintentos con backoff, DLQ.
- Cancelación, pausa/reanudación.
- Prevención de ciclos (max depth, visited set).
- Recuperación ante reinicios (requeue pending).
- Trazabilidad por paso.

## 9. Reportes
- Métricas de conversaciones, operadores, equipos, clientes, automatizaciones, IA, segmentaciones.
- Filtros por fecha/operador/equipo/canal/segmentación.
- Exportación CSV/XLSX.

## 10. Panel de supervisión
- Dashboard de automatizaciones activas, ejecuciones en curso/fallidas, aprobaciones pendientes, tareas, alertas, historial, métricas.

## 11. Integración con Skills y RAG
- Reutilizar SkillRuntime y GroundedGenerationService.
- Ejecución en modos disabled/assist/auto.
- Permisos, aprobaciones, idempotencia, auditoría.

## 12. Plan de implementación F6
- F6.0 Discovery (este documento).
- F6.1 Modelo de datos y contratos.
- F6.2 Motor de triggers y eventos.
- F6.3 Condiciones y acciones.
- F6.4 Constructor visual.
- F6.5 Aprobaciones y supervisión.
- F6.6 Reportes y métricas.
- F6.7 QA integral, seguridad y release.

## 13. Quality Gates
- QG-1 Arquitectura.
- QG-2 Integridad de datos.
- QG-3 Ejecuciones idempotentes.
- QG-4 Seguridad y RBAC.
- QG-5 Acciones externas.
- QG-6 Consentimiento.
- QG-7 Reintentos y recuperación.
- QG-8 Auditoría.
- QG-9 Frontend.
- QG-10 Reportes.
- QG-11 Pruebas unitarias.
- QG-12 Pruebas de integración.
- QG-13 Playwright E2E.
- QG-14 Documentación y release.

## 14. Riesgos
- Ciclos infinitos en automatizaciones → max depth + visited set.
- Envío masivo de mensajes → rate limiting + aprobación + consentimiento.
- Mezcla de métricas reales/estimadas → etiquetar origen.
- Complejidad del constructor visual → empezar con JSON config, UI visual después.

## 15. Deudas técnicas mantenidas
- Proveedor real de embeddings/LLM.
- Flujo WhatsApp real.
- Inbox WhatsApp.
- Playwright en host.
- Cobertura adicional.

No se modificó código. Esperar aprobación para F6.1.

## 16. Versionado y reproducibilidad
- Cada ejecución referencia una AutomationVersion inmutable.
- Registrar versión, configuración, disparador y contexto de ejecución.
- Modificaciones posteriores no alteran ejecuciones anteriores.

## 17. Idempotencia y concurrencia
- Clave de idempotencia por evento + automatización + versión.
- Restricción única en PostgreSQL (automationId, idempotencyKey).
- Recuperación ante reinicios: requeue pending executions.
- Reintentos con backoff exponencial.

## 18. Programación
- Zona horaria configurable: America/Argentina/Buenos_Aires.
- Horarios comerciales y días no laborables configurables.
- Ejecuciones únicas y recurrentes (cron).
- Pausa, cancelación y reprogramación.

## 19. Prevención de ciclos
- Profundidad máxima de ejecución (max 10).
- Detección de eventos repetidos (visited set).
- Límite de ejecuciones por automatización y entidad.
- Tiempo máximo de ejecución (timeout).
- Protección contra automatizaciones que se disparan mutuamente.

## 20. Simulación (dry-run)
- Modo dry-run completo: evalúa condiciones y lista acciones sin efectos.
- Visualización de condiciones evaluadas.
- Acciones que se ejecutarían.
- Resultado esperado de cada paso.
- Ningún efecto externo ni modificación real de datos.

## 21. Acciones externas
- Consentimiento vigente obligatorio.
- Aprobaciones configurables.
- Límites de frecuencia y volumen.
- Registro de usuario que autorizó.
- Nunca enviar mensajes reales durante pruebas.

## 22. Reportes — origen de métricas
- Separar métricas de Chatwoot (conversaciones), CRM (clientes) y automatizaciones (ejecuciones).
- Documentar origen de cada métrica.
- Permisos de acceso y exportación.
- Evitar duplicaciones y resultados inconsistentes.

## 23. Matriz RBAC (propuesta)
- automation.read, automation.create, automation.update, automation.publish, automation.execute, automation.approve, automation.audit.read
- report.read, report.export
- supervision.read

## 24. Riesgos y mitigaciones (actualizado)
- Ciclos infinitos → max depth + visited set + límite por entidad.
- Envío masivo → rate limiting + aprobación + consentimiento.
- Métricas inconsistentes → etiquetar origen + validación.
- Complejidad constructor visual → empezar con JSON config.

## 25. Quality Gates (actualizado)
- QG-1 a QG-14 (ver sección 9 de F6.0) + QG-15 Simulación dry-run, QG-16 Prevención de ciclos.
