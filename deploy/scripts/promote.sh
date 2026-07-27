#!/usr/bin/env bash
# Promote the current staging image to a semver production tag by retagging
# it in ECR — no rebuild, guaranteeing production ships the exact bits that
# were validated in staging.
#
# Usage: promote.sh <ecr-registry-base> <version>
#   ecr-registry-base - ECR registry host, e.g. 123.dkr.ecr.ap-southeast-2.amazonaws.com
#   version           - semver version, without a leading "v" (e.g. 1.2.3)
#
# The image repository is derived from the git remote via lib.sh — see app_name().

set -euo pipefail

source "$(dirname "$0")/lib.sh"

ECR_REGISTRY_BASE="${1:?ecr-registry-base is required}"
VERSION="${2:?version is required}"

IMAGE_REPOSITORY="${ECR_REGISTRY_BASE}/app/$(app_name)"

docker buildx imagetools create \
  --tag "${IMAGE_REPOSITORY}:${VERSION}" \
  "${IMAGE_REPOSITORY}:staging"
