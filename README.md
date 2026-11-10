# Plataforma Integral de Atención Comercial

Foundation (F0): repositorio, arquitectura, despliegue.

## Stack
- Frontend: Next.js 15 + React + TypeScript + Tailwind
- Backend: Node.js + TypeScript + Express + Prisma
- DB: PostgreSQL 17
- Cache/Queue: Redis + BullMQ
- Auth: Better Auth + RBAC
- Deploy: Docker Compose

## Run (dev)
```
cp .env.example .env
# edit .env
docker compose up -d
```
Frontend: http://localhost:3010
API health: http://localhost:3010/api/v1/health

## Scripts
```
npm run lint
npm run typecheck
npm run test
npm run test:architecture
npm run build
npm run validate
```

## Documentation
See docs/ and context files.
