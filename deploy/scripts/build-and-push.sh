#!/usr/bin/env bash
# Build a multi-arch (amd64+arm64) image and push it to ECR tagged with the
# commit sha, `latest`, and `staging`. Run from the repo root.
#
# Usage: build-and-push.sh <ecr-registry-base> <sha> <cache-base>
#   ecr-registry-base - ECR registry host, e.g. 123.dkr.ecr.ap-southeast-2.amazonaws.com
#   sha                - commit sha to tag the image with (immutable reference)
#   cache-base         - ECR repo base used as a buildx registry cache (app name appended as the tag)
#
# The image repository (<ecr-registry-base>/app/<app-name>) is derived from
# the git remote via lib.sh — see app_name().

set -euo pipefail

source "$(dirname "$0")/lib.sh"

ECR_REGISTRY_BASE="${1:?ecr-registry-base is required}"
SHA="${2:?sha is required}"
CACHE_BASE="${3:?cache-base is required}"

APP="$(app_name)"
IMAGE_REPOSITORY="${ECR_REGISTRY_BASE}/app/${APP}"
CACHE_REPOSITORY="${CACHE_BASE}:${APP}"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from "type=registry,ref=${CACHE_REPOSITORY}" \
  --cache-to "type=registry,ref=${CACHE_REPOSITORY},mode=max" \
  --tag "${IMAGE_REPOSITORY}:${SHA}" \
  --tag "${IMAGE_REPOSITORY}:latest" \
  --tag "${IMAGE_REPOSITORY}:staging" \
  --push \
  .

# Surface the sha as a build parameter so downstream deploy steps can
# reference the exact image built here.
echo "##teamcity[setParameter name='outputs.imageTag' value='${SHA}']"
