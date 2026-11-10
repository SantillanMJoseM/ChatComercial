FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/web/package.json ./apps/web/
RUN cd apps/web && npm install
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm run build

FROM node:22-alpine
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=builder /app/apps/web ./
EXPOSE 3010
CMD ["npm","start"]
