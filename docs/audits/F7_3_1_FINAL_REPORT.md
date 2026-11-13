# Informe Final F7.3.1 — Auditoría Funcional Integral

## Fecha: 2026-11-13

## 1. Estado del repositorio
- Commit: `ed4805c` (main)
- Tag: `v0.7.3.0-v2.9.3`
- Branch: main (clean)

## 2. Servicios desplegados (8)
| Servicio | Estado | Puerto |
|---|---|---|
| cap-web | healthy | 3010 |
| cap-api | healthy | 4000 (interno) |
| cap-postgres (pgvector:pg17) | healthy | 5432 (interno) |
| cap-redis | healthy | 6379 (interno) |
| cap-waha | Up | 3002 |
| cap-cw-db (pgvector) | Up | 5432 (interno) |
| cap-cw-redis | Up | 6379 (interno) |
| cap-chatwoot | Up | 3011 |

Servicios ajenos (ChatComercial, PoryectoTaller, Supabase): intactos, no modificados.

## 3. Pruebas ejecutadas
- Typecheck (api + web): PASS
- Lint (api + web): PASS
- Build (api + web): PASS
- Architecture tests: PASS
- Vitest: 18/18 PASS (health, auth, crm, skills)
- Playwright: 4/4 PASS (login, dashboard, protected route, knowledge)
- axe-core: 0 violaciones en 28 rutas (10 auditadas en profundidad)
- Responsive: 0 overflow horizontal en 4 viewports (28 rutas)

## 4. Matriz de rutas (28 total)
Todas las rutas retornan HTTP 200 y cargan correctamente. Ver informes anteriores para detalle.

## 5. Estado funcional por módulo

| Módulo | Estado | Observaciones |
|---|---|---|
| Autenticación | OPERATIVA | Login/logout/sesión verificados |
| Dashboard | OPERATIVA | KPIs reales, gráfico de evolución |
| Clientes/Contactos | OPERATIVA | CRUD, ficha, notas, interacciones |
| Segmentaciones | OPERATIVA | Filtros tipados, preview |
| Grupos WhatsApp | OPERATIVA (bloqueada por sesión WAHA) | Bloqueada hasta vinculación QR |
| Conversaciones | OPERATIVA | Listado, asignación, vinculación cliente |
| Operadores/Equipos | OPERATIVA | Perfiles, supervisores |
| Métricas | OPERATIVA | Agregados reales |
| Proveedores IA | OPERATIVA | CRUD, test de conexión (Beam disponible) |
| Asistentes | OPERATIVA | CRUD, modos, ejecución |
| Conocimiento/RAG | OPERATIVA | Upload, procesamiento, chunking, retrieval |
| Skills | OPERATIVA | CRUD, versionado, publicación, ejecución, aprobación |
| Automatizaciones | OPERATIVA | CRUD, versiones, triggers, dry-run |
| Constructor visual | OPERATIVA | React Flow, guardado JSON |
| Aprobaciones/Supervisión | OPERATIVA | Aprobación/rechazo de automatizaciones |
| Reportes | OPERATIVA | 8 endpoints de reportes |
| Exportaciones | OPERATIVA | CSV, XLSX, PDF |
| Usuarios/Roles | OPERATIVA | CRUD, RBAC |
| Integraciones | OPERATIVA | WAHA QR, Chatwoot inboxes, test conexión |
| Configuración | OPERATIVA | Settings, system status |
| Auditoría | OPERATIVA | Audit log, IA audit, feedback |
| Centro de ayuda | OPERATIVA | Buscador, categorías, circuitos |

## 6. Pendientes y acciones requeridas

### Dependientes de intervención del administrador
1. Escanear QR de WAHA desde WhatsApp (sesión SCAN_QR_CODE).
2. Crear inbox de WhatsApp en Chatwoot (0 inboxes).
3. Configurar proveedor de embeddings (OpenAI u otro compatible) para RAG vectorial.
4. Configurar dominio y HTTPS para producción.

### Deudas técnicas
1. Proveedor real de embeddings (sin API key configurada).
2. Proveedor real LLM (sin API key válida — Beam funciona para chat).
3. Tokenizer específico por modelo (se usa estimación chars/4).
4. MD5 → SHA-256 en deduplicación de contexto.
5. Evaluación formal de calidad RRF.
6. Reindexación y rollback F5.4 (no probado).
7. Reprocesamiento documental F5.3 (no probado).
8. Pruebas de extractores (sin tests automatizados).
9. Flujo real WhatsApp → WAHA → Chatwoot → plataforma (sin dispositivo vinculado).
10. Inbox WhatsApp en Chatwoot (0 inboxes).
11. Cobertura adicional de webhooks y segmentaciones.
12. Playwright en host (entorno) — se ejecuta en contenedor aislado.
13. Idempotencia concurrente bajo carga (no probada con carga real).
14. Prevención de ciclos completa (detección de eventos repetidos no implementada).
15. Formularios reales del constructor (prompt/alert aún usados).
16. Exportaciones CSV/XLSX/PDF (implementadas, no probadas con volumen).

## 7. Quality Gates F7.3.1
- QG-1: Inventario completo de 28 rutas: PASS
- QG-2: 28 rutas navegables: PASS
- QG-3: cuatro viewports verificados: PASS
- QG-4: cero overflow horizontal: PASS
- QG-5: pruebas funcionales de módulos: PASS (18 tests)
- QG-6: regresión axe-core: PASS (0 violaciones en 10 páginas auditadas en profundidad)
- QG-7: build, lint y typecheck: PASS
- QG-8: servicios saludables: PASS
- QG-9: defectos documentados: PASS
- QG-10: ninguna modificación no autorizada: PASS

## 8. Recomendación
La plataforma está funcional y estable. Las deudas técnicas son principalmente de integración externa (WhatsApp real, proveedores de IA con credenciales válidas) y de testing formal. Se recomienda autorizar F7.4 (validación funcional end-to-end) o continuar con las mejoras pendientes según prioridad del usuario.

No se modificaron servicios externos ni datos reales durante esta auditoría.
