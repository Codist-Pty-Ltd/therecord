# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# The Record — NestJS API (apps/api)
#
# Build context is apps/api (see docker-compose.yml). The API is deliberately
# self-contained — it does not import from packages/shared-types — so we can
# build from its own folder.
#
# Multi-stage build:
#   - builder      : installs all deps and compiles NestJS to dist/
#   - development  : dev image used by docker-compose.yml (hot reload via
#                    mounted ./apps/api/src -> /app/src, runs start:dev)
#   - runner       : lean production image, runs node dist/main
# ---------------------------------------------------------------------------

# ======================================================================
# builder
# ======================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ======================================================================
# development  (used by docker-compose.yml, target: development)
# ======================================================================
FROM node:20-alpine AS development

ENV NODE_ENV=development \
    PORT=3091

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3091

CMD ["npm", "run", "start:dev"]

# ======================================================================
# runner  (used by docker-compose.prod.yml, target: runner)
# ======================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    PORT=3091

WORKDIR /app

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 -G nodejs

COPY --chown=nestjs:nodejs package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs

EXPOSE 3091

CMD ["node", "dist/main"]
