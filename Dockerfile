# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare --activate $(node -p "require('./package.json').packageManager") \
  && pnpm install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Env vars required at build time (T3 Env validates these); pass as build args if needed.
ENV NEXT_TELEMETRY_DISABLED=1
ARG SITE_URL
ENV SITE_URL=${SITE_URL}

RUN corepack enable && corepack prepare --activate $(node -p "require('./package.json').packageManager") \
  && pnpm build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG SITE_URL
ENV SITE_URL=${SITE_URL}

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Leverage the standalone output (next.config.ts sets `output: 'standalone'`)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
