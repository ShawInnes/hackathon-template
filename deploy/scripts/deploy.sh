#!/usr/bin/env bash
# Deploy the Helm chart to an EKS cluster. Run from the repo root.
#
# Usage: deploy.sh <env> <image-tag> <cluster> <region> <ecr-registry-base>
#   env               - staging | production (selects deploy/chart/values-<env>.yaml)
#   image-tag         - image tag to deploy (e.g. "staging" or a semver version)
#   cluster           - EKS cluster name
#   region            - AWS region
#   ecr-registry-base - ECR registry host, e.g. 123.dkr.ecr.ap-southeast-2.amazonaws.com
#
# App name, image repository, namespace, and release name are all derived
# from the git remote via lib.sh — see app_name(). Staging is namespace- and
# release-isolated from production (both suffixed "-staging").
#
# AUTH_SECRET (env var) is passed through to the chart if set; leave unset to
# reuse whatever value is already in the cluster (helm upgrade won't clear it
# unless --set-string is passed with an empty value, so only pass it when set).

set -euo pipefail

source "$(dirname "$0")/lib.sh"

ENVIRONMENT="${1:?env is required (staging|production)}"
IMAGE_TAG="${2:?image-tag is required}"
CLUSTER="${3:?cluster is required}"
REGION="${4:?region is required}"
ECR_REGISTRY_BASE="${5:?ecr-registry-base is required}"

CHART_DIR="$(dirname "$0")/../chart"

APP="$(app_name)"
IMAGE_REPOSITORY="${ECR_REGISTRY_BASE}/app/${APP}"

if [[ "${ENVIRONMENT}" == "staging" ]]; then
  NAMESPACE="app-${APP}-staging"
  RELEASE="${APP}-staging"
else
  NAMESPACE="app-${APP}"
  RELEASE="${APP}"
fi

aws eks update-kubeconfig --name "${CLUSTER}" --region "${REGION}"

HELM_ARGS=(
  upgrade --install "${RELEASE}" "${CHART_DIR}"
  -f "${CHART_DIR}/values.yaml"
  -f "${CHART_DIR}/values-${ENVIRONMENT}.yaml"
  --namespace "${NAMESPACE}"
  --create-namespace
  --set "appName=${APP}"
  --set "image.repository=${IMAGE_REPOSITORY}"
  --set "image.tag=${IMAGE_TAG}"
  --wait
)

if [[ -n "${AUTH_SECRET:-}" ]]; then
  HELM_ARGS+=(--set-string "secret.authSecret=${AUTH_SECRET}")
fi

helm "${HELM_ARGS[@]}"
