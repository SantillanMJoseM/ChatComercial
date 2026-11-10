FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
RUN cd apps/api && npm install
COPY apps/api ./apps/api
COPY database ./database
COPY packages ./packages
COPY infra/docker/api-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN cd apps/api && npx prisma generate --schema ../../database/prisma/schema.prisma
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["/entrypoint.sh"]
