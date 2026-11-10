#!/bin/sh
set -eu

# Invoke the lockfile-installed CLI directly: no runtime downloads or npx cache.
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

# Standalone builds need their generated server; regular builds use next start.
# Explicit commands (for example npm run worker) are preserved.
if [ "$#" -eq 3 ] && [ "$1" = npm ] && [ "$2" = run ] && [ "$3" = start ] \
  && [ -f .next/standalone/server.js ]; then
  exec node .next/standalone/server.js
fi
exec "$@"
