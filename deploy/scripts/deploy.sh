#!/usr/bin/env bash
# Usage: deploy.sh <staging|production> <image-tag> <ecr-registry-base>
set -euo pipefail
source "$(dirname "$0")/lib.sh"
export PATH="${HOME}/.local/bin:${PATH}"

ENVIRONMENT="${1:?environment is required (staging|production)}"
IMAGE_TAG="${2:?image-tag is required}"
ECR_REGISTRY_BASE="${3:?ecr-registry-base is required}"
case "${ENVIRONMENT}" in
  staging|production) ;;
  *) echo "Invalid environment: ${ENVIRONMENT}" >&2; exit 2 ;;
esac

CHART_DIR="$(cd "$(dirname "$0")/../chart" && pwd)"
APP="$(app_name)"
NAMESPACE="app-${APP}"
RELEASE="${APP}"
if [[ "${ENVIRONMENT}" == staging ]]; then
  NAMESPACE+="-staging"
  RELEASE+="-staging"
fi
export KUBECONFIG="$(pwd)/kubeconfig.yaml"

HELM_ARGS=(
  upgrade --install "${RELEASE}" "${CHART_DIR}"
  -f "${CHART_DIR}/values.yaml"
  -f "${CHART_DIR}/values-${ENVIRONMENT}.yaml"
  --namespace "${NAMESPACE}" --create-namespace
  --set-string "appName=${APP}"
  --set-string "image.repository=${ECR_REGISTRY_BASE}/${APP}"
  --set-string "image.tag=${IMAGE_TAG}"
  --wait --timeout 5m
)
# Migration from legacy manifests is explicit; never take ownership by default.
case "${ADOPT_EXISTING_RESOURCES:-false}" in
  true) HELM_ARGS+=(--take-ownership) ;;
  false) ;;
  *) echo "ADOPT_EXISTING_RESOURCES must be true or false" >&2; exit 2 ;;
esac
for setting in CNPG_BACKUP_BUCKET CNPG_BACKUP_ROLE; do
  if [[ -n "${!setting:-}" ]]; then
    case "${setting}" in
      CNPG_BACKUP_BUCKET) key=destinationBucket ;;
      CNPG_BACKUP_ROLE) key=iamRoleArn ;;
    esac
    HELM_ARGS+=(--set-string "postgres.backup.${key}=${!setting}")
  fi
done

helm "${HELM_ARGS[@]}"
# envFrom is read at process start. Restart after ESO sync so pods reload keys
# even when an image or Secret reference has not changed.
kubectl wait --for=condition=Ready "externalsecret/${APP}-secret" \
  --namespace "${NAMESPACE}" --timeout=120s
kubectl rollout restart "deployment/${APP}" --namespace "${NAMESPACE}"
kubectl rollout status "deployment/${APP}" --namespace "${NAMESPACE}" --timeout=300s
