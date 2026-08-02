# Use the official Node.js runtime as the base image
FROM node:24-alpine AS base

# Install system dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
FROM base AS deps
RUN npm ci

# Build stage
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Generate the Prisma client (required for Next.js build to typecheck)
# Dummy DATABASE_URL — `prisma generate` doesn't connect, but prisma.config.ts requires the var to load
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

# Build the application
# Dummy DATABASE_URL — Next.js's "Collecting page data" phase loads route handlers, which instantiate the Prisma client
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# Production stage
#
# Ships the full built app (not just Next's pruned `.next/standalone` output)
# because the worker (worker/index.ts) runs via `tsx` directly against source
# and needs the full node_modules tree + src/. One image, two roles — run
# `npm run start` for the web server or `npm run worker` for the background
# job worker, selected via the container command.
FROM node:24-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache dumb-init libc6-compat

# Create a non-root user
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy the full built application — Next server output, source (worker/,
# src/ including the generated Prisma client), and full node_modules
# (already contains prisma and tsx from the builder's `npm ci`, so no
# separate runtime install step is needed).
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/src ./src
COPY --from=builder --chown=nextjs:nextjs /app/worker ./worker
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nextjs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nextjs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nextjs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nextjs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nextjs /app/healthcheck.js ./healthcheck.js

# Entrypoint script (runs migrations before starting the app)
COPY --chown=nextjs:nextjs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Use dumb-init to handle signals properly, then run migrations via entrypoint
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Start the web server by default; override the container command with
# `npm run worker` to run the background job worker from the same image.
CMD ["npm", "run", "start"]
