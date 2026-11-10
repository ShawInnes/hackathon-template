# Deployment workflow

The same `.teamcity/`, `deploy/`, Dockerfile, entrypoint, healthcheck and Docker
ignore file are used by the template and its applications. Application differences
belong in `deploy/chart/values-staging.yaml` and `values-production.yaml`.

## Pipeline

A push to the VCS root's default branch builds an amd64 image. The version is
`<package.json major>.<minor>.<TeamCity counter>`. Build & Publish pushes SHA,
version, `latest` and `staging` tags and labels the commit `v<version>`.
Staging automatically deploys the SHA. Production is a manual TeamCity build
with a snapshot dependency on staging and deploys that build's version tag.
There is no production tag trigger. Select the intended successful staging build
when promoting; TeamCity may queue dependencies if no suitable build is available.

App names come from the origin remote's basename without `.git` or `t1-`.
Production uses release `<app>` in namespace `app-<app>`; staging adds `-staging`
to both. Existing release names, selectors and database cluster names are retained.

TeamCity inherits `AWS_ACCOUNT_ID`, `AWS_REGION`, `KUBECONFIG_B64`,
`CNPG_BACKUP_BUCKET`, `CNPG_BACKUP_ROLE` and ECR connection `PROJECT_EXT_163`.
Backups need the bucket/role only when enabled. The VCS root must permit tagging.
Agents need Docker Buildx and cluster access. The shared `teamcity/build-cache`
ECR repository must exist. The pipeline installs kubectl, envsubst and Helm;
Helm must be at least 3.17 when the resource-adoption option is used.
The cluster needs Crossplane's ECR Repository controller, nginx ingress,
CloudNativePG, External Secrets v1 and an SSM ParameterStore ClusterSecretStore
named `aws-ssm-store`. CNPG backups additionally require the barman-cloud plugin.

## Secrets and initial seeding

Application secrets always come from SSM through External Secrets. There is no
inline Helm secret or manually referenced app Secret mode. Each namespace gets
an `<app>-secret` populated by its ExternalSecret. CloudNativePG still manages
its database credentials; an external database can use its own connection Secret.

By default both environments read `/techlab/workloads/<app>`, preserving existing
SSM paths. To isolate them, set `externalSecret.ssmPath` in each environment's
values, for example `/techlab/workloads/<app>/staging`. Seed every configured path
before deploying. The seed script reads the path from the rendered chart.

All immediate child parameters with lowercase kebab-case names are discovered.
For example `auth-secret` becomes `AUTH_SECRET`, `openai-api-key` becomes
`OPENAI_API_KEY`, and `resend-api-key` becomes `RESEND_API_KEY`. Nested paths are
excluded. `auth-secret` is explicitly required. The store's IAM role needs
`ssm:GetParametersByPath`, `ssm:GetParameter` and KMS decryption where applicable.
Discovery and key rewriting follow the
[External Secrets rewrite documentation](https://external-secrets.io/latest/guides/datafrom-rewrite/).

Create a local JSON file outside the repository, with a string value for each key:

```json
{
  "AUTH_SECRET": "replace-with-an-existing-or-new-random-secret",
  "OPENAI_API_KEY": "replace-with-your-key"
}
```

Run from the repository root using Python 3.9+, Helm, AWS CLI and credentials with
SSM read/write and the relevant KMS permissions:

```sh
python3 deploy/scripts/seed-secrets.py staging /private/tmp/app-secrets.json --dry-run
python3 deploy/scripts/seed-secrets.py staging /private/tmp/app-secrets.json --region ap-southeast-2
python3 deploy/scripts/seed-secrets.py production /private/tmp/app-secrets.json --region ap-southeast-2
```

An empty JSON object generates `AUTH_SECRET` on first use. Existing parameters
are kept by default; `--overwrite` requires an explicit `AUTH_SECRET` and replaces
supplied keys. Optional `--kms-key-id` selects a customer-managed KMS key.
Values are sent as SecureStrings through a mode-0600 temporary file, never printed
or put in process arguments. Delete the local input file when finished. For an
existing app, seed its current AUTH_SECRET to preserve sessions. Seed credentials
are operator credentials; deployment jobs do not need SSM write access.

Reserve `DATABASE_URL`, `PORT`, `AUTH_URL`, `APP_BASE_URL`, `APP_NAME`, `NAMESPACE`
and `AUTH_ENABLED` for the chart. Put non-secret application settings in `config`
using their exact environment variable names, for example `INITIAL_ADMIN_EMAILS`.
The two base URLs always use `https://<ingress.host>`. OIDC public client IDs and
issuers can be in `config`, or SSM as `auth-oidc-id` and `auth-oidc-issuer`.

External Secrets uses `creationPolicy: Orphan` so legacy Secrets can be updated
and remain when its ExternalSecret is removed; `deletionPolicy: Retain` preserves
them if upstream parameters disappear. After Helm succeeds, deployment waits for
ExternalSecret Ready and restarts the app to reload environment variables. SSM
changes outside a deployment are fetched at the refresh interval but require a
pod restart to change the running process environment.

## Migrating existing resources

The canonical script validates the environment, puts installed tools on PATH,
overrides image identity, and passes optional backup settings. It does not pass
application credentials or ad hoc app settings through Helm CLI arguments.

Resource adoption is disabled by default. For the first migration from manifests,
set TeamCity's `env.ADOPT_EXISTING_RESOURCES=true`, or run:

```sh
ADOPT_EXISTING_RESOURCES=true deploy/scripts/deploy.sh staging <sha> <ecr-registry>
```

This passes Helm's `--take-ownership`. Check that named resources belong to the
intended app before using it, and reset the parameter afterward. Normal deployments
never relabel resources or take ownership automatically.

`postgres.appSuperuser` defaults to `false`. Set it to `true` only for an app that
requires superuser access. It changes the initialization SQL of a new database;
it does not grant or revoke privileges on an already initialized cluster.

## Container runtime

All images listen on port 3000 and run as numeric UID/GID 1001. Flatpack-specific
port 8000, UID 10001, read-only root filesystem, `/tmp` mount and cache redirection
have been removed. The filesystem is writable by the app where its runtime needs
it; there is no special volume requirement.

The Dockerfile retains full lockfile-installed dependencies, built output, Prisma
assets, source and optional `worker/` and `scripts/` directories. This supports the
template's `npm run worker` command and avoids a second, independently versioned
Prisma installation. The tradeoff is a larger image than a web-only standalone
image. Migrations use the local Prisma binary before the selected command runs.
Standalone builds use their generated server with public/static assets included;
regular builds use `npm run start`. Explicit worker commands are preserved.
Workers should override/disable the HTTP Docker healthcheck when run separately.

Docker's default healthcheck accepts HTTP 2xx–4xx at `/` (including auth redirects).
Set `HEALTHCHECK_PATH=/api/health` for an application that provides that endpoint;
explicit health paths require a 2xx response. Product retains this setting in its
environment values.
Docker HEALTHCHECK is not a Kubernetes readiness probe; this chart does not yet
provide application readiness probes.

## Validation

Run `deploy/scripts/validate.sh` to syntax-check shell scripts, lint the chart and
render both environments. It also runs in Build & Publish before the Docker build.
Run `python3 -m unittest discover -s deploy/tests` for isolated deployment, seed and
entrypoint behavior checks. Tests use mocks and do not access AWS or Kubernetes.
