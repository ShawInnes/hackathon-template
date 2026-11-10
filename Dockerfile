# One runtime supports the web app, Prisma migrations and optional TS workers.
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# Assemble an explicit runtime allowlist; never copy the build context wholesale.
# Keep lockfile-installed dependencies, including Prisma and tsx, for workers.
RUN mkdir /runtime \
    && cp -a node_modules .next src public package.json package-lock.json \
       next.config.ts tsconfig.json prisma prisma.config.ts healthcheck.js \
       docker-entrypoint.sh /runtime/ \
    && for directory in worker scripts; do \
         if [ -d "$directory" ]; then cp -a "$directory" /runtime/; fi; \
       done \
    && if [ -f /runtime/.next/standalone/server.js ]; then \
         cp -a public /runtime/.next/standalone/; \
         cp -a .next/static /runtime/.next/standalone/.next/; \
       fi \
    && chmod +x /runtime/docker-entrypoint.sh

FROM node:24-alpine AS runner
RUN apk add --no-cache dumb-init libc6-compat \
    && addgroup --system --gid 1001 nextjs \
    && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder --chown=1001:1001 /runtime/ ./
USER 1001
EXPOSE 3000
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node healthcheck.js || exit 1
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
