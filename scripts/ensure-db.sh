#!/usr/bin/env bash
#
# Ensure a Postgres database is available for local development.
#
# Resolution order:
#   1. An already-configured DATABASE_URL (shell env, then .env) — probed for reachability.
#   2. docker compose  (./docker-compose.yml → postgres on 127.0.0.1:5432)
#   3. A bare local Postgres already listening on localhost:5432.
#   4. Otherwise: print copy-pasteable options and exit non-zero.
#
# Run automatically by the `predev` npm script before `prisma migrate deploy`.
set -euo pipefail

ENV_FILE=".env"
LOCAL_DSN="postgresql://postgres:postgres@localhost:5432/postgres"

# --- helpers ---------------------------------------------------------------

# Print the configured DATABASE_URL (shell env wins over .env), or return 1.
resolve_url() {
  if [ -n "${DATABASE_URL:-}" ]; then
    printf '%s' "$DATABASE_URL"
    return 0
  fi
  if [ -f "$ENV_FILE" ]; then
    local line
    line=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | tail -1 || true)
    if [ -n "$line" ]; then
      line=${line#DATABASE_URL=}
      printf '%s' "${line//\"/}"
      return 0
    fi
  fi
  return 1
}

# Extract host and port (default 5432) from a postgres:// connection string.
url_host() { printf '%s' "$1" | sed -E 's#^[a-z]+://([^@]*@)?([^/?:]+).*#\2#'; }
url_port() {
  local hp
  hp=$(printf '%s' "$1" | sed -E 's#^[a-z]+://([^@]*@)?([^/?]+).*#\2#')
  case "$hp" in
    *:*) printf '%s' "${hp##*:}" ;;
    *) printf '5432' ;;
  esac
}

# Return 0 if a Postgres is reachable at host:port.
pg_reachable() {
  local host=$1 port=$2
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h "$host" -p "$port" -q && return 0 || return 1
  fi
  (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null && { exec 3>&- 3<&-; return 0; } || return 1
}

# Append DATABASE_URL to .env if not already present.
write_dsn() {
  local dsn=$1
  touch "$ENV_FILE"
  if grep -qE '^DATABASE_URL=' "$ENV_FILE"; then
    return 0
  fi
  printf 'DATABASE_URL="%s"\n' "$dsn" >>"$ENV_FILE"
  echo "→ Wrote DATABASE_URL to $ENV_FILE ($dsn)"
}

print_options() {
  cat >&2 <<'EOF'

❌ No reachable Postgres database found.

Pick one:
  • Docker:  docker compose up -d postgres        (uses ./docker-compose.yml)
  • Local:   install Postgres, create a database, then set DATABASE_URL in .env
  • Remote:  set DATABASE_URL in .env to a hosted Postgres connection string

Example .env line:
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
EOF
}

# --- 1. already configured -------------------------------------------------

if url=$(resolve_url); then
  host=$(url_host "$url")
  port=$(url_port "$url")
  if pg_reachable "$host" "$port"; then
    echo "✓ DATABASE_URL configured and reachable ($host:$port)."
    exit 0
  fi
  echo "⚠ DATABASE_URL is set but $host:$port is not reachable." >&2
  # If it points at a docker-compose host, try to bring it up.
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "  Attempting: docker compose up -d postgres…" >&2
    docker compose up -d postgres || true
    for _ in $(seq 1 30); do pg_reachable "$host" "$port" && break; sleep 1; done
    if pg_reachable "$host" "$port"; then
      echo "✓ Database is now reachable ($host:$port)."
      exit 0
    fi
  fi
  print_options
  exit 1
fi

# --- 2. no URL: try docker compose ----------------------------------------

echo "No DATABASE_URL configured — provisioning a local database…"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Docker detected — starting postgres via docker compose…"
  docker compose up -d postgres
  for _ in $(seq 1 30); do pg_reachable localhost 5432 && break; sleep 1; done
  if pg_reachable localhost 5432; then
    echo "✓ Postgres started via docker compose."
    write_dsn "$LOCAL_DSN"
    exit 0
  fi
fi

# --- 3. bare local postgres ------------------------------------------------

if pg_reachable localhost 5432; then
  echo "✓ Found a local Postgres on localhost:5432."
  write_dsn "$LOCAL_DSN"
  exit 0
fi

# --- 4. give up with guidance ---------------------------------------------

print_options
exit 1
