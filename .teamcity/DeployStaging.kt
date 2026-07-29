import Common.commonFeatures
import Common.createKubeConfig
import Common.installKubectlEnvsubstAndHelm
import Common.mandatorySnapshot
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.finishBuildTrigger

/**
 * Deploys the freshly-built image to the isolated staging namespace.
 * Triggered automatically once BuildAndPublish succeeds on main.
 *
 * The image is pinned to the commit sha published by BuildAndPublish (via its
 * `outputs.imageTag` parameter), NOT the mutable `:staging` tag. Deploying by
 * a floating tag renders the rendered manifest byte-identical between runs, so
 * `helm upgrade` produces no pod-template change and Kubernetes performs no
 * rollout — the automatic deploy would silently leave the old image running.
 */
object DeployStaging : BuildType({
    id("DeployStaging")
    name = "Deploy - Staging"
    description = "helm upgrade --install into the staging namespace"
    type = Type.DEPLOYMENT
    maxRunningBuilds = 1
    allowExternalStatus = true

    params {
        // Leave blank to keep whatever AUTH_SECRET is already in the cluster —
        // deploy.sh only passes --set-string when this is non-empty.
        password("env.AUTH_SECRET", "%staging.authSecret%")
    }

    vcs {
        root(DslContext.settingsRoot)
        cleanCheckout = true
        branchFilter = "+:<default>"
    }

    dependencies {
        mandatorySnapshot(BuildAndPublish) {}
    }

    triggers {
        finishBuildTrigger {
            buildType = absoluteId("BuildAndPublish")
            successfulOnly = true
            branchFilter = "+:<default>"
        }
    }

    steps {
        installKubectlEnvsubstAndHelm()
        createKubeConfig()
        script {
            name = "Ensure namespace exists"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                deploy/scripts/ensure-namespace.sh
            """.trimIndent()
        }        
        script {
            name = "Helm upgrade --install (staging)"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                deploy/scripts/deploy.sh staging "${asDependency("outputs.imageTag", "BuildAndPublish")}" "${variables.ecrRegistryBase}"
            """.trimIndent()
        }
    }

    failureConditions {
        executionTimeoutMin = 30
    }

    requirements {
        moreThan("teamcity.agent.hardware.memorySizeMb", "500")
        equals("teamcity.agent.jvm.os.name", "Linux")
    }

    features {
        commonFeatures()
    }
})
