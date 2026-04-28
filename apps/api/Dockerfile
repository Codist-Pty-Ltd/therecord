# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# The Record — NestJS API (apps/api)
#
# Build context is the monorepo root (see docker-compose.yml) so `npm ci` uses
# the root package-lock.json and installs hoisted workspace deps under
# /repo/node_modules (no separate apps/api/node_modules).
#
# The API does not import packages/shared-types; workspace package.json files
# are still copied so the root lockfile resolves.
#
# Multi-stage build:
#   - deps         : npm ci for @therecord/api
#   - builder      : compiles NestJS to apps/api/dist/
#   - development  : dev image (start:dev, hot reload)
#   - runner       : production image, node dist/main
# ---------------------------------------------------------------------------

# ======================================================================
# deps
# ======================================================================
FROM node:20-alpine AS deps

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm ci --workspace=@therecord/api

# ======================================================================
# builder
# ======================================================================
FROM node:20-alpine AS builder

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=@therecord/api

# ======================================================================
# development  (used by docker-compose.yml, target: development)
# ======================================================================
FROM node:20-alpine AS development

ENV NODE_ENV=development \
    PORT=3091

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

WORKDIR /repo/apps/api

EXPOSE 3091

CMD ["npm", "run", "start:dev"]

# ======================================================================
# runner  (used by docker-compose.prod.yml, target: runner)
# ======================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    PORT=3091

WORKDIR /repo

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 -G nodejs

COPY --chown=nestjs:nodejs package.json package-lock.json ./
COPY --chown=nestjs:nodejs apps/api/package.json apps/api/
COPY --chown=nestjs:nodejs apps/web/package.json apps/web/
COPY --chown=nestjs:nodejs packages/shared-types/package.json packages/shared-types/

RUN npm ci --workspace=@therecord/api --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/dist ./apps/api/dist

USER nestjs

WORKDIR /repo/apps/api

EXPOSE 3091

CMD ["node", "dist/main.js"]
