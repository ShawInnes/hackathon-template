#!/usr/bin/env bash
# Render the templated manifests in this directory in-place. Run from TeamCity
# after the build step.
#
# Usage:
#   APP_NAME=t1-myapp \
#   IMAGE_NAME=ghcr.io/org/myapp:v1.0.0 \
#   BASE_DOMAIN=example.com \
#     ./render.sh

set -euo pipefail

: "${APP_NAME:?APP_NAME is required}"
: "${IMAGE_NAME:?IMAGE_NAME is required}"
: "${BASE_DOMAIN:?BASE_DOMAIN is required}"

APP_NAME="${APP_NAME#t1-}"
export APP_NAME
export IMAGE="${IMAGE_NAME}"
export HOST_NAME="${APP_NAME}.${BASE_DOMAIN}"

cd "$(dirname "$0")"

# Whitelist vars so nginx-style placeholders ($http_*) survive untouched.
for f in *.yaml; do
  envsubst '${APP_NAME} ${IMAGE} ${HOST_NAME}' < "$f" > "$f.tmp"
  mv "$f.tmp" "$f"
done

echo "Rendered $(ls *.yaml | wc -l | tr -d ' ') manifests for ${APP_NAME} (host ${HOST_NAME})."
