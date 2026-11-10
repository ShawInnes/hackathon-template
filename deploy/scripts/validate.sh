#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
source "${ROOT}/deploy/scripts/lib.sh"
cd "${ROOT}"
for script in deploy/scripts/*.sh; do bash -n "${script}"; done
sh -n docker-entrypoint.sh
APP="$(app_name)"
for environment in staging production; do
  helm lint deploy/chart -f "deploy/chart/values-${environment}.yaml" --set-string "appName=${APP}" --set-string image.repository=validation/app
  helm template "${APP}" deploy/chart -f "deploy/chart/values-${environment}.yaml" --namespace "app-${APP}-${environment}" --set-string "appName=${APP}" --set-string image.repository=validation/app >/dev/null
done
