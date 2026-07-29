#!/usr/bin/env bash
# Build an amd64 image and push it to ECR tagged with the commit sha,
# `latest`, `staging`, and the build version. Run from the repo root.
#
# Usage: build-and-push.sh <ecr-registry-base> <sha> <version> <cache-base>
#   ecr-registry-base - ECR registry host, e.g. 123.dkr.ecr.ap-southeast-2.amazonaws.com
#   sha                - commit sha to tag the image with (immutable reference)
#   version            - TeamCity build number (e.g. 0.1.42) — the tag DeployProduction promotes
#   cache-base         - ECR repo base used as a buildx registry cache (app name appended as the tag)
#
# The image repository (<ecr-registry-base>/<app-name>) is derived from
# the git remote via lib.sh — see app_name().

set -euo pipefail

source "$(dirname "$0")/lib.sh"

ECR_REGISTRY_BASE="${1:?ecr-registry-base is required}"
SHA="${2:?sha is required}"
VERSION="${3:?version is required}"
CACHE_BASE="${4:?cache-base is required}"

APP="$(app_name)"
IMAGE_REPOSITORY="${ECR_REGISTRY_BASE}/${APP}"
CACHE_REPOSITORY="${CACHE_BASE}:${APP}"

# The default buildx driver ("docker") can't export cache to a registry.
# Use a docker-container builder instead; create it once per agent, reuse on
# subsequent builds.
docker buildx create --name amd64builder --driver docker-container --use 2>/dev/null || docker buildx use amd64builder

docker buildx build \
  --platform linux/amd64 \
  --cache-from "type=registry,ref=${CACHE_REPOSITORY}" \
  --cache-to "type=registry,ref=${CACHE_REPOSITORY},mode=max" \
  --tag "${IMAGE_REPOSITORY}:${SHA}" \
  --tag "${IMAGE_REPOSITORY}:latest" \
  --tag "${IMAGE_REPOSITORY}:staging" \
  --tag "${IMAGE_REPOSITORY}:${VERSION}" \
  --push \
  .

# Surface the sha and version as build parameters so downstream deploy
# steps can reference the exact image built here.
echo "##teamcity[setParameter name='outputs.imageTag' value='${SHA}']"
echo "##teamcity[setParameter name='outputs.version' value='${VERSION}']"
