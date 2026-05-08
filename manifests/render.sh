#!/usr/bin/env bash
# Render the templated manifests in this directory in-place. Run once after
# cloning the template, then commit the result.
#
# Usage:
#   APP_NAME=myapp \
#   IMAGE=ghcr.io/org/myapp:v1.0.0 \
#   HOST_NAME=myapp.example.com \
#     ./render.sh

set -euo pipefail

: "${APP_NAME:?APP_NAME is required}"
: "${IMAGE:?IMAGE is required}"
: "${HOST_NAME:?HOST_NAME is required}"

cd "$(dirname "$0")"

# Whitelist vars so nginx-style placeholders ($http_*) survive untouched.
for f in *.yaml; do
  envsubst '${APP_NAME} ${IMAGE} ${HOST_NAME}' < "$f" > "$f.tmp"
  mv "$f.tmp" "$f"
done

echo "Rendered $(ls *.yaml | wc -l | tr -d ' ') manifests for ${APP_NAME}."
