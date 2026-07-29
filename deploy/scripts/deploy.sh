#!/usr/bin/env bash
# Deploy the Helm chart to the cluster targeted by kubeconfig.yaml. Run from
# the repo root.
#
# Usage: deploy.sh <env> <image-tag> <ecr-registry-base>
#   env               - staging | production (selects deploy/chart/values-<env>.yaml)
#   image-tag         - image tag to deploy (e.g. "staging" or a semver version)
#   ecr-registry-base - ECR registry host, e.g. 123.dkr.ecr.ap-southeast-2.amazonaws.com
#
# App name, image repository, namespace, and release name are all derived
# from the git remote via lib.sh — see app_name(). Staging is namespace- and
# release-isolated from production (both suffixed "-staging").
#
# Expects kubeconfig.yaml at the repo root, written by the "Create Kube
# Config" TeamCity step (decodes the KUBECONFIG_B64 secret) — no AWS
# credentials are needed for this step.
#
# AUTH_SECRET (env var) is passed through to the chart if set; leave unset to
# reuse whatever value is already in the cluster (helm upgrade won't clear it
# unless --set-string is passed with an empty value, so only pass it when set).
#
# CNPG_BACKUP_BUCKET / CNPG_BACKUP_ROLE (env vars) supply the S3 backup
# destination and IRSA role for the CNPG cluster. They come from TeamCity
# project-level parameters, not chart defaults — the chart's `required()`
# guard fails the deploy if postgres.backup.enabled is true and either is
# unset.

set -euo pipefail

source "$(dirname "$0")/lib.sh"

ENVIRONMENT="${1:?env is required (staging|production)}"
IMAGE_TAG="${2:?image-tag is required}"
ECR_REGISTRY_BASE="${3:?ecr-registry-base is required}"

CHART_DIR="$(dirname "$0")/../chart"

APP="$(app_name)"
IMAGE_REPOSITORY="${ECR_REGISTRY_BASE}/${APP}"

if [[ "${ENVIRONMENT}" == "staging" ]]; then
  NAMESPACE="app-${APP}-staging"
  RELEASE="${APP}-staging"
else
  NAMESPACE="app-${APP}"
  RELEASE="${APP}"
fi

export KUBECONFIG="$(pwd)/kubeconfig.yaml"

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

if [[ -n "${CNPG_BACKUP_BUCKET:-}" ]]; then
  HELM_ARGS+=(--set-string "postgres.backup.destinationBucket=${CNPG_BACKUP_BUCKET}")
fi

if [[ -n "${CNPG_BACKUP_ROLE:-}" ]]; then
  HELM_ARGS+=(--set-string "postgres.backup.iamRoleArn=${CNPG_BACKUP_ROLE}")
fi

helm "${HELM_ARGS[@]}"
