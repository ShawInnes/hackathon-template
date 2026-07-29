#!/usr/bin/env bash
# Idempotently ensure the app's Crossplane-managed ECR repository exists and
# is ready before build-and-push.sh tries to push to it. Safe to re-run on
# every build — `kubectl apply` is a no-op once the Repository is already
# Ready. Run from the repo root.
#
# Usage: ensure-ecr.sh
#
# Expects kubectl/envsubst on PATH (installKubectlAndEnvsubst TeamCity step)
# and kubeconfig.yaml at the repo root (createKubeConfig TeamCity step).

set -euo pipefail

source "$(dirname "$0")/lib.sh"

export PATH="${HOME}/.local/bin:${PATH}"
export KUBECONFIG="$(pwd)/kubeconfig.yaml"

APP="$(app_name)"

APP_NAME="${APP}" envsubst < "$(dirname "$0")/../ecr.yaml" | kubectl apply -f -

kubectl wait --for=condition=Ready "repository.ecr.aws.m.upbound.io/${APP}" \
  --namespace "app-${APP}" --timeout=120s
