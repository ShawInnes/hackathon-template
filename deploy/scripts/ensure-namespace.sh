#!/usr/bin/env bash
# Idempotently ensure the app's namespace exists before any namespace-scoped
# resource (e.g. ensure-ecr.sh's Repository) is applied into it. Safe to
# re-run on every build — `kubectl apply` is a no-op once the namespace
# already exists. Run from the repo root.
#
# Usage: ensure-namespace.sh
#
# Expects kubectl on PATH (installKubectlAndEnvsubst TeamCity step) and
# kubeconfig.yaml at the repo root (createKubeConfig TeamCity step).

set -euo pipefail

source "$(dirname "$0")/lib.sh"

export PATH="${HOME}/.local/bin:${PATH}"
export KUBECONFIG="$(pwd)/kubeconfig.yaml"

APP="$(app_name)"

kubectl create namespace "app-${APP}" --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace "app-${APP}-staging" --dry-run=client -o yaml | kubectl apply -f -
