terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
    random = {
      source = "hashicorp/random"
    }
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "coder" {
}

provider "aws" {
}

data "coder_task" "me" {}

data "aws_secretsmanager_secret" "init_secrets" {
  name = "hackathon/coder-ai"
}

data "aws_secretsmanager_secret_version" "init_secrets" {
  secret_id = data.aws_secretsmanager_secret.init_secrets.id
}

locals {
  init_secrets = jsondecode(data.aws_secretsmanager_secret_version.init_secrets.secret_string)

  access_url_host   = replace(data.coder_workspace.me.access_url, "https://", "")
  application_host  = "app--${data.coder_workspace.me.name}--${data.coder_workspace_owner.me.name}.${local.access_url_host}"
  application_url   = "https://${local.application_host}"
  litellm_api_url   = "http://litellm.litellm:4000"
  litellm_admin_key = try(local.init_secrets["litellm_admin_key"], "")
  auth_oidc_id      = try(local.init_secrets["auth_oidc_id"], "")
  auth_oidc_issuer  = try(local.init_secrets["auth_oidc_issuer"], "")
  
  database_url      = "postgresql://postgres:${random_password.postgres_password.result}@localhost:5432/dev"

  memory_gb     = tonumber(data.coder_parameter.memory.value)
  dev_memory_mi = floor(local.memory_gb * 0.7 * 1024)
  db_memory_mi  = floor(local.memory_gb * 0.25 * 1024)
  node_heap_mb  = floor(local.dev_memory_mi * 0.6)

  cpu_cores = tonumber(data.coder_parameter.cpu.value)
  dev_cpu_m = floor(local.cpu_cores * 0.7 * 1000)
  db_cpu_m  = floor(local.cpu_cores * 0.25 * 1000)
}

resource "coder_app" "app" {
  agent_id     = coder_agent.main.id
  slug         = "app"
  display_name = "Running App"
  url          = "http://localhost:3000"
  subdomain    = true
  open_in      = "tab"
  share        = "public"
}

resource "coder_env" "anthropic_custom_headers" {
  agent_id = coder_agent.main.id
  name     = "ANTHROPIC_CUSTOM_HEADERS"
  value    = "x-litellm-end-user-id: ${data.coder_workspace_owner.me.email}"
}

resource "coder_env" "anthropic_base_url" {
  agent_id = coder_agent.main.id
  name     = "ANTHROPIC_BASE_URL"
  value    = local.litellm_api_url
}

resource "coder_env" "openai_base_url" {
  agent_id = coder_agent.main.id
  name     = "OPENAI_BASE_URL"
  value    = local.litellm_api_url
}

resource "coder_env" "database_url" {
  agent_id = coder_agent.main.id
  name     = "DATABASE_URL"
  value    = local.database_url
}

resource "coder_env" "allowed_dev_origins" {
  agent_id = coder_agent.main.id
  name     = "ALLOWED_DEV_ORIGINS"
  value    = local.application_host
}

resource "coder_env" "auth_url" {
  agent_id = coder_agent.main.id
  name     = "AUTH_URL"
  value    = local.application_url
}

resource "coder_env" "auth_secret" {
  agent_id = coder_agent.main.id
  name     = "AUTH_SECRET"
  value    = random_password.auth_secret.result
}

resource "coder_env" "auth_oidc_id" {
  agent_id = coder_agent.main.id
  name     = "AUTH_OIDC_ID"
  value    = local.auth_oidc_id
}

resource "coder_env" "auth_enabled" {
  agent_id = coder_agent.main.id
  name     = "AUTH_ENABLED"
  value    = data.coder_parameter.enable_oidc.value
}

resource "coder_env" "auth_oidc_issuer" {
  agent_id = coder_agent.main.id
  name     = "AUTH_OIDC_ISSUER"
  value    = local.auth_oidc_issuer
}

resource "coder_env" "anthropic_model" {
  agent_id = coder_agent.main.id
  name     = "ANTHROPIC_MODEL"
  value    = "opus"
}

resource "coder_env" "anthropic_default_sonnet_model" {
  agent_id = coder_agent.main.id
  name     = "ANTHROPIC_DEFAULT_SONNET_MODEL"
  value    = "claude-4-6-sonnet"
}

resource "coder_env" "anthropic_default_haiku_model" {
  agent_id = coder_agent.main.id
  name     = "ANTHROPIC_DEFAULT_HAIKU_MODEL"
  value    = "claude-4-5-haiku"
}

resource "coder_env" "anthropic_default_opus_model" {
  agent_id = coder_agent.main.id
  name     = "ANTHROPIC_DEFAULT_OPUS_MODEL"
  value    = "claude-4-7-opus"
}

resource "coder_env" "claude_code_disable_nonessential_traffic" {
  agent_id = coder_agent.main.id
  name     = "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"
  value    = "1"
}

resource "coder_env" "claude_code_experimental_agent_teams" {
  agent_id = coder_agent.main.id
  name     = "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"
  value    = "1"
}

resource "coder_env" "claude_code_disable_experimental_betas" {
  agent_id = coder_agent.main.id
  name     = "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS"
  value    = "1"
}

resource "coder_env" "node_options" {
  agent_id = coder_agent.main.id
  name     = "NODE_OPTIONS"
  value    = "--max-old-space-size=${local.node_heap_mb}"
}

resource "random_password" "postgres_password" {
  length      = 16
  special     = false
  min_numeric = 2
  min_upper   = 2
  min_lower   = 2
}

resource "random_password" "auth_secret" {
  length  = 32
  special = true
}

module "git-clone" {
  count    = data.coder_parameter.clone_template.value == "true" ? 1 : 0
  source   = "registry.coder.com/modules/git-clone/coder"
  version  = "1.0.0"
  agent_id = coder_agent.main.id
  url      = data.coder_parameter.template_repo.value
  path     = "/home/coder/project"
}

module "code-server" {
  count                   = data.coder_workspace.me.start_count
  display_name            = "Code Editor"
  source                  = "registry.coder.com/coder/code-server/coder"
  version                 = "1.4.4"
  agent_id                = coder_agent.main.id
  subdomain               = true
  open_in                 = "tab"
  auto_install_extensions = true
  extensions              = ["anthropic.claude-code","mtxr.sqltools", "mtxr.sqltools-driver-pg"]
  folder                  = "/home/coder/project"
  machine_settings = {
    "workbench.startupEditor" : "none",
    "workbench.colorTheme" : "Dark 2026",
    "chat.commandCenter.enabled" : false,
    "chat.setupFromDialog" : false
    "chat.extensionUnification.enabled" : false,
    "chat.disableAIFeatures" : true,
    "claudeCode.disableLoginPrompt" : true,
    "claudeCode.hideOnboarding" : true,
    "claudeCode.preferredLocation" : "sidebar"
    "claudeCode.allowDangerouslySkipPermissions" : true,
    "claudeCode.initialPermissionMode" : "bypassPermissions",
    "sqltools.connections": [
      {
        "name": "Local Database",
        "driver": "PostgreSQL",
        "password": "$${env:PGPASSWORD}",
        "username": "$${env:PGUSER}",
        "server": "$${env:PGHOST}",
        "database": "$${env:PGDATABASE}"
      }
    ]
  }
}

module "tmux" {
  source      = "registry.coder.com/anomaly/tmux/coder"
  version     = "1.0.4"
  agent_id    = coder_agent.main.id
  sessions    = ["app"]
  tmux_config = <<-EOT
    set -g mouse on
    set -g history-limit 10000
  EOT
}

module "claude-code" {
  source                       = "registry.coder.com/coder/claude-code/coder"
  version                      = "4.9.2"
  agent_id                     = coder_agent.main.id
  dangerously_skip_permissions = true
  enable_aibridge              = false
  report_tasks                 = false
  web_app                      = false
  workdir                      = "/home/coder/project"

  claude_code_version = "2.1.112"

  model = "opus"

  subdomain = true
}

variable "namespace" {
  type        = string
  description = "The Kubernetes namespace to create workspaces in (must exist prior to creating workspaces). If the Coder host is itself running as a Pod on the same Kubernetes cluster as you are deploying workspaces to, set this to the same namespace."
}

data "coder_parameter" "cpu" {
  name         = "cpu"
  display_name = "CPU"
  description  = "The number of CPU cores"
  default      = "4"
  icon         = "/icon/memory.svg"
  mutable      = true
  order        = 1
  option {
    name  = "2 Cores"
    value = "2"
  }
  option {
    name  = "4 Cores"
    value = "4"
  }
  option {
    name  = "8 Cores"
    value = "8"
  }
}

data "coder_parameter" "memory" {
  name         = "memory"
  display_name = "Memory"
  description  = "The amount of memory in GB"
  default      = "4"
  icon         = "/icon/memory.svg"
  mutable      = true
  order        = 2
  option {
    name  = "2 GB"
    value = "2"
  }
  option {
    name  = "4 GB"
    value = "4"
  }
  option {
    name  = "8 GB"
    value = "8"
  }
}

data "coder_parameter" "home_disk_size" {
  name         = "home_disk_size"
  display_name = "Home disk size"
  description  = "The size of the home disk in GB"
  default      = "10"
  type         = "number"
  icon         = "/emojis/1f4be.png"
  mutable      = false
  order        = 3
  validation {
    min = 1
    max = 99999
  }
}

data "coder_parameter" "enable_oidc" {
  name         = "enable_oidc"
  display_name = "Enable OIDC Authentication"
  description  = "Automatically configures the template app with Okta OIDC"
  type         = "bool"
  default      = false
  mutable      = true
}

data "coder_parameter" "clone_template" {
  name         = "clone_template"
  display_name = "Clone Template Repository"
  description  = "Whether to clone a template repository into the workspace on creation"
  type         = "bool"
  default      = true
  mutable      = false
  order        = 4
}

data "coder_parameter" "template_repo" {
  name         = "template_repo"
  display_name = "Template Repository URL"
  description  = "Git URL of the template repository to clone into /home/coder/project (only used when 'Clone Template Repository' is enabled)"
  type         = "string"
  default      = "https://github.com/ShawInnes/hackathon-template.git"
  mutable      = false
  order        = 5
}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

resource "coder_script" "startup" {
  agent_id           = coder_agent.main.id
  display_name       = "startup"
  run_on_start       = true
  start_blocks_login = true
  script             = <<-EOT
    #!/bin/bash
    set -e

    grep -q 'LOCAL_BIN_PATH' ~/.profile 2>/dev/null || cat >> ~/.profile << 'PROFILE'
    # LOCAL_BIN_PATH
    export PATH="$HOME/.local/bin:$PATH"
    export PS1='\[\033[01;32m\]\u\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
    PROFILE

    CLONE_TEMPLATE="${data.coder_parameter.clone_template.value}"

    if [ "$CLONE_TEMPLATE" = "true" ]; then
      # Wait for git-clone module to finish
      for i in $(seq 1 60); do
        [ -d /home/coder/project ] && break
        echo "Waiting for /home/coder/project to appear... ($i/60)"
        sleep 2
      done

      if [ ! -d /home/coder/project ]; then
        echo "ERROR: /home/coder/project did not appear after 120s, aborting startup"
        exit 1
      fi
    else
      echo "clone_template is disabled; skipping template clone"
      mkdir -p /home/coder/project
    fi

    # Wait for tmux module to finish installing
    for i in $(seq 1 30); do
      command -v tmux &>/dev/null && break
      sleep 2
    done

    if ! command -v tmux &>/dev/null; then
      echo "ERROR: tmux not available after 60s, aborting startup"
      exit 1
    fi

    if [ "$CLONE_TEMPLATE" = "true" ]; then
      cd /home/coder/project

      npm install
      npx prisma generate
      npx prisma migrate deploy

      # Start app in tmux session (after install so dependencies are ready)
      tmux new-session -d -s app -c /home/coder/project 'npm run dev; exec bash' 2>/dev/null \
        || tmux send-keys -t app 'cd /home/coder/project && npm run dev' Enter
    fi
  EOT

}

resource "coder_script" "shutdown" {
  agent_id     = coder_agent.main.id
  display_name = "startup"
  run_on_stop  = true
  script       = <<-EOT
    #!/bin/bash
    set -e

    echo "Shutting down with script"

  EOT
}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  display_apps {
    vscode          = false
    vscode_insiders = false
  }

  env = {
    GIT_AUTHOR_NAME             = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_AUTHOR_EMAIL            = "${data.coder_workspace_owner.me.email}"
    GIT_COMMITTER_NAME          = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_COMMITTER_EMAIL         = "${data.coder_workspace_owner.me.email}"
    CODER_WORKSPACE_OWNER_EMAIL = "${data.coder_workspace_owner.me.email}"
  }

  # The following metadata blocks are optional. They are used to display
  # information about your workspace in the dashboard. You can remove them
  # if you don't want to display any information.
  # For basic resources, you can use the `coder stat` command.
  # If you need more control, you can write your own script.
  metadata {
    display_name = "CPU Usage"
    key          = "0_cpu_usage"
    script       = "coder stat cpu"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "RAM Usage"
    key          = "1_ram_usage"
    script       = "coder stat mem"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Home Disk"
    key          = "3_home_disk"
    script       = "coder stat disk --path $${HOME}"
    interval     = 60
    timeout      = 1
  }
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "coder-${data.coder_workspace.me.id}-home"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-pvc"
      "app.kubernetes.io/instance" = "coder-pvc-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      //Coder-specific labels.
      "com.coder.resource"       = "true"
      "com.coder.workspace.id"   = data.coder_workspace.me.id
      "com.coder.workspace.name" = data.coder_workspace.me.name
      "com.coder.user.id"        = data.coder_workspace_owner.me.id
      "com.coder.user.username"  = data.coder_workspace_owner.me.name
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
    }
  }
  wait_until_bound = false
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "${data.coder_parameter.home_disk_size.value}Gi"
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim_v1" "postgres" {
  metadata {
    name      = "coder-${data.coder_workspace.me.id}-postgres"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "postgres-pvc"
      "app.kubernetes.io/instance" = "postgres-pvc-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      //Coder-specific labels.
      "com.coder.resource"       = "true"
      "com.coder.workspace.id"   = data.coder_workspace.me.id
      "com.coder.workspace.name" = data.coder_workspace.me.name
      "com.coder.user.id"        = data.coder_workspace_owner.me.id
      "com.coder.user.username"  = data.coder_workspace_owner.me.name
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
    }
  }
  wait_until_bound = false
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "100Gi"
      }
    }
  }
}

resource "kubernetes_secret_v1" "workspace" {
  metadata {
    name      = "coder-${data.coder_workspace.me.id}-workspace"
    namespace = var.namespace
    labels = {
      "com.coder.resource"       = "true"
      "com.coder.workspace.id"   = data.coder_workspace.me.id
      "com.coder.workspace.name" = data.coder_workspace.me.name
    }
  }
  type = "Opaque"
  data = {
    "litellm-admin-key" = local.litellm_admin_key
    "postgres-password" = random_password.postgres_password.result
    "coder-agent-token" = coder_agent.main.token
  }
}

resource "kubernetes_config_map_v1" "init_scripts" {
  metadata {
    name      = "coder-${data.coder_workspace.me.id}-init-scripts"
    namespace = var.namespace
    labels = {
      "com.coder.resource"       = "true"
      "com.coder.workspace.id"   = data.coder_workspace.me.id
      "com.coder.workspace.name" = data.coder_workspace.me.name
    }
  }
  data = {
    "init-litellm.py" = file("${path.module}/scripts/init-litellm.py")
    "init-git.sh"     = file("${path.module}/scripts/init-git.sh")
  }
}

resource "kubernetes_deployment_v1" "main" {
  count = data.coder_workspace.me.start_count
  depends_on = [
    kubernetes_persistent_volume_claim_v1.home,
    kubernetes_persistent_volume_claim_v1.postgres,
    kubernetes_config_map_v1.init_scripts,
    kubernetes_secret_v1.workspace
  ]
  wait_for_rollout = false
  metadata {
    name      = "coder-${data.coder_workspace.me.id}"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-workspace"
      "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.workspace.name"   = data.coder_workspace.me.name
      "com.coder.user.id"          = data.coder_workspace_owner.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        "app.kubernetes.io/name"     = "coder-workspace"
        "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
        "app.kubernetes.io/part-of"  = "coder"
        "com.coder.resource"         = "true"
        "com.coder.workspace.id"     = data.coder_workspace.me.id
        "com.coder.workspace.name"   = data.coder_workspace.me.name
        "com.coder.user.id"          = data.coder_workspace_owner.me.id
        "com.coder.user.username"    = data.coder_workspace_owner.me.name
      }
    }

    strategy {
      type = "Recreate"
    }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name"     = "coder-workspace"
          "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
          "app.kubernetes.io/part-of"  = "coder"
          "com.coder.resource"         = "true"
          "com.coder.workspace.id"     = data.coder_workspace.me.id
          "com.coder.workspace.name"   = data.coder_workspace.me.name
          "com.coder.user.id"          = data.coder_workspace_owner.me.id
          "com.coder.user.username"    = data.coder_workspace_owner.me.name
        }
      }

      spec {
        security_context {
          run_as_user     = 1000
          fs_group        = 1000
          run_as_non_root = true
        }

        init_container {
          name    = "git-init"
          image   = "alpine:3.19"
          command = ["sh", "/scripts/init-git.sh"]

          env {
            name  = "HOME"
            value = "/home/coder"
          }

          volume_mount {
            mount_path = "/home/coder"
            name       = "home"
            read_only  = false
          }

          volume_mount {
            mount_path = "/scripts"
            name       = "init-scripts"
            read_only  = true
          }
        }

        init_container {
          name    = "litellm-init"
          image   = "python:3.12-slim"
          command = ["python3", "/scripts/init-litellm.py"]

          env {
            name  = "HOME"
            value = "/home/coder"
          }

          env {
            name  = "LITELLM_API_URL"
            value = local.litellm_api_url
          }

          env {
            name = "LITELLM_API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.workspace.metadata.0.name
                key  = "litellm-admin-key"
              }
            }
          }

          env {
            name  = "CODER_WORKSPACE_OWNER_EMAIL"
            value = data.coder_workspace_owner.me.email
          }

          volume_mount {
            mount_path = "/home/coder"
            name       = "home"
            read_only  = false
          }

          volume_mount {
            mount_path = "/scripts"
            name       = "init-scripts"
            read_only  = true
          }
        }

        container {
          name              = "dev"
          image             = "codercom/example-node:ubuntu"
          image_pull_policy = "Always"
          command           = ["sh", "-c", coder_agent.main.init_script]
          security_context {
            run_as_user = "1000"
          }
          env {
            name = "CODER_AGENT_TOKEN"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.workspace.metadata.0.name
                key  = "coder-agent-token"
              }
            }
          }
          env {
            name  = "PGHOST"
            value = "localhost"
          }
          env {
            name  = "PGUSER"
            value = "postgres"
          }
          env {
            name = "PGPASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.workspace.metadata.0.name
                key  = "postgres-password"
              }
            }
          }
          env {
            name  = "PGDATABASE"
            value = "dev"
          }

          resources {
            requests = {
              "cpu"    = "${local.dev_cpu_m}m"
              "memory" = "${local.dev_memory_mi}Mi"
            }
            limits = {
              "cpu"    = "${local.dev_cpu_m}m"
              "memory" = "${local.dev_memory_mi}Mi"
            }
          }

          volume_mount {
            mount_path = "/home/coder"
            name       = "home"
            read_only  = false
          }
        }

        container {
          name              = "db"
          image             = "pgvector/pgvector:pg18"
          image_pull_policy = "Always"
          command           = ["docker-entrypoint.sh"]
          args = [
            "postgres",
            "-c", "shared_buffers=128MB",
            "-c", "work_mem=4MB",
            "-c", "maintenance_work_mem=64MB",
            "-c", "effective_cache_size=${floor(local.db_memory_mi * 0.5)}MB",
          ]

          env {
            name  = "PGDATA"
            value = "/var/lib/postgresql/data/k8s"
          }

          env {
            name  = "POSTGRES_USER"
            value = "postgres"
          }

          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.workspace.metadata.0.name
                key  = "postgres-password"
              }
            }
          }

          env {
            name  = "POSTGRES_DB"
            value = "postgres"
          }

          volume_mount {
            mount_path = "/var/lib/postgresql/data"
            name       = "postgres-data-directory"
          }

          resources {
            requests = {
              "cpu"    = "${local.db_cpu_m}m"
              "memory" = "${local.db_memory_mi}Mi"
            }
            limits = {
              "cpu"    = "${local.db_cpu_m}m"
              "memory" = "${local.db_memory_mi}Mi"
            }
          }
        }

        volume {
          name = "home"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.home.metadata.0.name
            read_only  = false
          }
        }

        volume {
          name = "postgres-data-directory"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.postgres.metadata.0.name
          }
        }

        volume {
          name = "init-scripts"
          config_map {
            name         = kubernetes_config_map_v1.init_scripts.metadata.0.name
            default_mode = "0555"
          }
        }

        toleration {
          key      = "workload"
          operator = "Equal"
          value    = "coder"
          effect   = "NoSchedule"
        }

        node_selector = {
          "node-type" = "coder"
        }

        affinity {
          // This affinity attempts to spread out all workspace pods evenly across
          // nodes.
          pod_anti_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 1
              pod_affinity_term {
                topology_key = "kubernetes.io/hostname"
                label_selector {
                  match_expressions {
                    key      = "app.kubernetes.io/name"
                    operator = "In"
                    values   = ["coder-workspace"]
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
