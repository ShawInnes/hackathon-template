package Common

import jetbrains.buildServer.configs.kotlin.BuildFeatures
import jetbrains.buildServer.configs.kotlin.BuildSteps
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.Dependencies
import jetbrains.buildServer.configs.kotlin.FailureAction
import jetbrains.buildServer.configs.kotlin.SnapshotDependency
import jetbrains.buildServer.configs.kotlin.buildFeatures.dockerRegistryConnections
import jetbrains.buildServer.configs.kotlin.buildFeatures.perfmon
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import variables

/**
 * Snapshot dependency that fails/cancels this build if the dependency build
 * fails or is cancelled, instead of silently running against stale artifacts.
 */
fun Dependencies.mandatorySnapshot(buildType: BuildType, init: SnapshotDependency.() -> Unit) {
    snapshot(buildType) {
        init(this)
        onDependencyFailure = FailureAction.FAIL_TO_START
        onDependencyCancel = FailureAction.CANCEL
    }
}

/**
 * Features shared by every build/deploy step in this pipeline: perf metrics
 * and ECR login (for docker/helm steps that pull or push images). EKS access
 * for the deploy build types comes from the KUBECONFIG_B64 secret, not an
 * AWS connection.
 */
fun BuildFeatures.commonFeatures() {
    perfmon {}

    dockerRegistryConnections {
        loginToRegistry = on {
            dockerRegistryId = variables.ecrConnectionName
        }
    }
}

/**
 * Installs kubectl and envsubst into ~/.local/bin. Agents don't ship with
 * either pre-installed; add this step before any step that shells out to
 * kubectl/envsubst directly or via a script under deploy/scripts.
 */ 
fun BuildSteps.installKubectlAndEnvsubst() {
    script {
        name = "Install Kubectl & Envsubst"
        scriptContent = """
            #!/usr/bin/env bash
            set -euo pipefail

            mkdir -p ~/.local/bin

            curl -s -LO "https://dl.k8s.io/release/${'$'}(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${'$'}(uname -m | sed -e 's/x86_64/amd64/' -e 's/aarch64/arm64/')/kubectl"
            chmod +x kubectl
            mv ./kubectl ~/.local/bin/kubectl

            curl -s -L "https://github.com/a8m/envsubst/releases/download/v1.4.3/envsubst-${'$'}(uname -s)-${'$'}(uname -m | sed 's/aarch64/arm64/')" -o envsubst
            chmod +x envsubst
            mv ./envsubst ~/.local/bin/envsubst
        """.trimIndent()
    }
}

/**
 * Installs kubectl, envsubst, and helm into ~/.local/bin. Same as
 * installKubectlAndEnvsubst() above, plus helm; use this instead on any
 * build that shells out to `helm` (e.g. via deploy/scripts/deploy.sh).
 */
fun BuildSteps.installKubectlEnvsubstAndHelm() {
    script {
        name = "Install Kubectl, Envsubst & Helm"
        scriptContent = """
            #!/usr/bin/env bash
            set -euo pipefail

            mkdir -p ~/.local/bin

            curl -s -LO "https://dl.k8s.io/release/${'$'}(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${'$'}(uname -m | sed -e 's/x86_64/amd64/' -e 's/aarch64/arm64/')/kubectl"
            chmod +x kubectl
            mv ./kubectl ~/.local/bin/kubectl

            curl -s -L "https://github.com/a8m/envsubst/releases/download/v1.4.3/envsubst-${'$'}(uname -s)-${'$'}(uname -m | sed 's/aarch64/arm64/')" -o envsubst
            chmod +x envsubst
            mv ./envsubst ~/.local/bin/envsubst

            curl -s https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | USE_SUDO=false HELM_INSTALL_DIR=~/.local/bin bash
        """.trimIndent()
    }
}

/**
 * Decodes the KUBECONFIG_B64 secret (inherited TeamCity project param) to
 * kubeconfig.yaml at the checkout root. Scripts under deploy/scripts that
 * need cluster access point KUBECONFIG at this file rather than decoding it
 * themselves.
 */
fun BuildSteps.createKubeConfig() {
    script {
        name = "Create Kube Config"
        scriptContent = """
            #!/usr/bin/env bash
            set -euo pipefail

            echo "${'$'}KUBECONFIG_B64" | base64 -d > %teamcity.build.checkoutDir%/kubeconfig.yaml
            chmod 600 %teamcity.build.checkoutDir%/kubeconfig.yaml
        """.trimIndent()
    }
}
