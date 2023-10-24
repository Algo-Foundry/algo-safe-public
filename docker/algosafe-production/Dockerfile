FROM node:18-alpine AS base

FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

ARG BASE_DIR=../..
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY $BASE_DIR/package.json $BASE_DIR/yarn.lock* $BASE_DIR/package-lock.json* $BASE_DIR/pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS builder
ARG BASE_DIR=../..
ARG DEPLOY_DIR=../var/www/html/algo-safe
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This will do the trick, use the corresponding env file for each environment.
COPY $BASE_DIR/.env.production .env
RUN yarn build

FROM base AS runner
WORKDIR /app
ARG DEPLOY_DIR=../var/www/html/algo-safe

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public $DEPLOY_DIR/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone $DEPLOY_DIR
COPY --from=builder --chown=nextjs:nodejs /app/.next/static $DEPLOY_DIR/.next/static

# Create log directory
RUN mkdir $DEPLOY_DIR/logs

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME localhost

CMD ["node", "../var/www/html/algo-safe/server.js"]