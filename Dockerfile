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
FROM node:24-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache dumb-init libc6-compat

# Create a non-root user
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/healthcheck.js ./healthcheck.js

# Prisma assets needed at runtime for `migrate deploy`
COPY --from=builder --chown=nextjs:nextjs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nextjs /app/prisma.config.ts ./prisma.config.ts

# Install Prisma CLI fresh — npm creates .bin/prisma as a proper symlink, so the
# WASM loader resolves prisma_schema_build_bg.wasm correctly. Pinned to match
# package.json; bump together when upgrading prisma.
RUN npm install --no-save --no-audit --no-fund prisma@^7.7.0 dotenv \
    && chown -R nextjs:nextjs node_modules

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

# Start the application
CMD ["node", "server.js"]
