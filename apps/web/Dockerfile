# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# The Record — Next.js 15 web app (apps/web)
#
# IMPORTANT: this Dockerfile expects the build context to be the **monorepo
# root**, not apps/web, because Next.js needs access to the
# packages/shared-types workspace. See docker-compose.yml:
#
#     web:
#       build:
#         context: .
#         dockerfile: apps/web/Dockerfile
#
# Multi-stage build:
#   - deps         : root workspace install (hoisted node_modules at /repo/node_modules)
#   - builder      : runs `next build` with output: 'standalone'
#   - development  : dev image used by docker-compose.yml (next dev, hot reload)
#   - runner       : lean production image, runs Next.js standalone server
# ---------------------------------------------------------------------------

# ======================================================================
# deps — install workspace deps for @therecord/web (hoisted to repo root)
# ======================================================================
FROM node:20-alpine AS deps

# Root .npmrc sets script-shell=bash for Windows dev; Alpine has no bash.
ENV npm_config_script_shell=/bin/sh

# libc6-compat is required by Next.js swc binaries on Alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /repo

# Copy manifests so `npm ci` matches the root lockfile (all workspaces listed).
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm ci --workspace=@therecord/web

# ======================================================================
# builder — compile Next.js
# ======================================================================
FROM node:20-alpine AS builder

ENV npm_config_script_shell=/bin/sh

RUN apk add --no-cache libc6-compat

WORKDIR /repo

ENV NEXT_TELEMETRY_DISABLED=1
ARG API_URL=http://localhost:3091
ARG NEXT_PUBLIC_API_URL=https://therecord.codist.co.za/api
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL=
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=
ARG NEXT_PUBLIC_BUILD_SHA=
ARG NEXT_PUBLIC_BUILD_DATE=
ARG NEXT_PUBLIC_BUILD_MESSAGE=
ENV API_URL=$API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=$NEXT_PUBLIC_UMAMI_SCRIPT_URL
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_BUILD_SHA=$NEXT_PUBLIC_BUILD_SHA
ENV NEXT_PUBLIC_BUILD_DATE=$NEXT_PUBLIC_BUILD_DATE
ENV NEXT_PUBLIC_BUILD_MESSAGE=$NEXT_PUBLIC_BUILD_MESSAGE

# Hoisted install: only /repo/node_modules exists (apps/web/node_modules is not created).
COPY --from=deps /repo/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=@therecord/web

# ======================================================================
# development (used by docker-compose.yml, target: development)
# Hot reload: docker-compose.yml mounts apps/web → /repo/apps/web at runtime.
# ======================================================================
FROM node:20-alpine AS development

ENV npm_config_script_shell=/bin/sh

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

WORKDIR /repo/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ======================================================================
# runner (used by docker-compose.prod.yml, target: runner)
# ======================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Next.js standalone bundle already contains only what the server needs,
# including the workspace-linked shared-types code.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

# Standalone layout in a monorepo keeps traced paths; server entry is under apps/web.
CMD ["node", "apps/web/server.js"]
