#!/bin/sh
set -e
cd /app/apps/api
npx prisma migrate deploy --schema ../../database/prisma/schema.prisma
if [ -n "$BOOTSTRAP_ADMIN_EMAIL" ]; then
  npx tsx src/seed.ts || true
fi
exec npm start
