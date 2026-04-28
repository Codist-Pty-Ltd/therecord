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
#   - deps         : installs root workspace node_modules
#   - builder      : runs `next build` with output: 'standalone'
#   - development  : dev image used by docker-compose.yml (next dev, hot reload)
#   - runner       : lean production image, runs Next.js standalone server
# ---------------------------------------------------------------------------

# ======================================================================
# deps — root-level install of all workspace deps (web + shared-types)
# ======================================================================
FROM node:20-alpine AS deps

# libc6-compat is required by Next.js swc binaries on Alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /repo

# Copy just the manifests first so the install layer is cacheable.
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

# `npm install` (not `ci`) so this still works when no lockfile is committed.
RUN npm install --no-audit --no-fund

# ======================================================================
# builder — compile Next.js
# ======================================================================
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /repo

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .

RUN npm run build --workspace=@therecord/web

# ======================================================================
# development (used by docker-compose.yml, target: development)
# Hot reload: docker-compose.yml mounts apps/web → /repo/apps/web at runtime.
# ======================================================================
FROM node:20-alpine AS development

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN npm install --no-audit --no-fund

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

# The standalone bundle in a monorepo context keeps the original paths,
# so the server entry point is apps/web/server.js.
CMD ["node", "apps/web/server.js"]
