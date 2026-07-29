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
        // Re-exposes the sha actually deployed to staging, so DeployProduction
        // can promote by sha instead of the mutable :staging tag.
        param("outputs.imageTag", asDependency("outputs.imageTag", "BuildAndPublish"))
        // Re-exposes the version minted by BuildAndPublish so
        // DeployProduction — which snapshots this build, not
        // BuildAndPublish directly — knows which already-tagged image to
        // promote.
        param("outputs.version", asDependency("outputs.version", "BuildAndPublish"))
        // CNPG backup bucket/role, set as parent-project Configuration
        // Parameters. deploy.sh passes them into the chart; the chart's
        // required() guard fails the deploy if either is missing.
        param("env.CNPG_BACKUP_BUCKET", "%CNPG_BACKUP_BUCKET%")
        param("env.CNPG_BACKUP_ROLE", "%CNPG_BACKUP_ROLE%")
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
        script {
            name = "Set build number from version"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                echo "##teamcity[buildNumber '%outputs.version%']"
            """.trimIndent()
        }
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
