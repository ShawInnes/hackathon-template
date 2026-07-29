import Common.commonFeatures
import Common.createKubeConfig
import Common.installKubectlEnvsubstAndHelm
import Common.mandatorySnapshot
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script

/**
 * Deploys the version last validated by DeployStaging into production.
 *
 * No retagging happens here: BuildAndPublish already pushed the image to
 * ECR tagged with its build number (its version), and VCS-labeled the
 * commit `v<version>` — that's the one version minted per commit, not
 * something invented at promotion time. This build just deploys it.
 *
 * The snapshot dependency on DeployStaging pins promotion to a specific,
 * staging-validated version — via its outputs.version parameter — rather
 * than the mutable `:staging` tag, which a later push to main could
 * overwrite before this build runs.
 *
 * Intentionally has no trigger. Run it manually from the TeamCity UI (or its
 * REST "Run Build" endpoint) to promote whatever DeployStaging last
 * validated — that manual click is the entire promotion gate, no git tag
 * push required.
 */
object DeployProduction : BuildType({
    id("DeployProduction")
    name = "Deploy - Production"
    description = "helm upgrade --install into the production namespace, using the version last validated in staging"
    type = Type.DEPLOYMENT
    maxRunningBuilds = 1
    allowExternalStatus = true

    params {
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
        mandatorySnapshot(DeployStaging) {}
    }

    steps {
        script {
            name = "Set build number from version"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                echo "##teamcity[buildNumber '${asDependency("outputs.version", "DeployStaging")}']"
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
            name = "Helm upgrade --install (production)"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                deploy/scripts/deploy.sh production "${asDependency("outputs.version", "DeployStaging")}" "${variables.ecrRegistryBase}"
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
