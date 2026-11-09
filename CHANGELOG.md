# Changelog

## [2.1.0] - 2026-11-09
### Added
- Autenticación básica (login, JWT).
- Capa LLM desacoplada.
- Backup script.
- Auditoría de botones.
- Mejoras visuales sidebar/layout.

## [2.0.0] - 2026-11-09
### Added
- Backend Node.js/TypeScript con API REST.
- PostgreSQL como fuente central de datos.
- Docker Compose multi-servicio (frontend, backend, PostgreSQL).
- Migraciones Prisma.

## [1.0.0] - 2026-11-09
### Added
- Módulos de Pedidos, Chat, Entrenador IA, Productos, Clientes y Configuración.
- Persistencia local con IndexedDB (Dexie).
- Importación masiva JSON/CSV y scraping simulado.
- Dockerfile, compose.yaml, nginx.conf y deploy.sh.
- Pruebas automatizadas con Vitest.
- Documentación de arquitectura, testing y despliegue.

### Fixed
- Persistencia y recarga de configuración.
- Integración de reglas de conocimiento en respuestas del chat.
- Soporte de voz en entrenador mediante SpeechRecognition.