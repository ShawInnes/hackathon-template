import Common.commonFeatures
import Common.mandatorySnapshot
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.finishBuildTrigger

/**
 * Deploys the freshly-built :staging image to the isolated staging namespace.
 * Triggered automatically once BuildAndPublish succeeds on main.
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
        branchFilter = "+:refs/heads/main"
    }

    dependencies {
        mandatorySnapshot(BuildAndPublish) {}
    }

    triggers {
        finishBuildTrigger {
            buildType = "BuildAndPublish"
            successfulOnly = true
            branchFilter = "+:refs/heads/main"
        }
    }

    steps {
        script {
            name = "Helm upgrade --install (staging)"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                deploy/scripts/deploy.sh staging staging "${variables.eksClusterName}" "${variables.ecrRegion}" "${variables.ecrRegistryBase}"
            """.trimIndent()
        }
    }

    failureConditions {
        executionTimeoutMin = 30
    }

    // Requires an agent with helm, kubectl, and the aws CLI available.
    requirements {
        moreThan("teamcity.agent.hardware.memorySizeMb", "500")
        equals("teamcity.agent.jvm.os.name", "Linux")
    }

    features {
        commonFeatures()
    }
})
