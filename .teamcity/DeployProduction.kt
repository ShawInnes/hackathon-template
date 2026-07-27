import Common.commonFeatures
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.vcs

/**
 * Promotes the current :staging image to a semver tag (no rebuild — retags
 * the exact bits that were validated in staging) and deploys it to production.
 *
 * Triggered by pushing a `vX.Y.Z` tag. Requires the VCS root's branch
 * specification to include `+:refs/tags/(v*)` so %teamcity.build.branch%
 * resolves to the bare version (e.g. "v1.2.3") rather than the full ref path.
 */
object DeployProduction : BuildType({
    id("DeployProduction")
    name = "Deploy - Production"
    description = "Promotes :staging to a semver tag and helm upgrade --install into the production namespace"
    type = Type.DEPLOYMENT
    maxRunningBuilds = 1
    allowExternalStatus = true

    params {
        password("env.AUTH_SECRET", "%production.authSecret%")
    }

    vcs {
        root(DslContext.settingsRoot)
        cleanCheckout = true
        branchFilter = "+:refs/tags/v*"
    }

    triggers {
        vcs {
            branchFilter = "+:refs/tags/v*"
        }
    }

    steps {
        script {
            name = "Promote staging image to semver tag"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                VERSION="%teamcity.build.branch%"
                VERSION="${'$'}{VERSION#v}"
                deploy/scripts/promote.sh "${variables.ecrRegistryBase}" "${'$'}VERSION"
            """.trimIndent()
        }
        script {
            name = "Helm upgrade --install (production)"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                VERSION="%teamcity.build.branch%"
                VERSION="${'$'}{VERSION#v}"
                deploy/scripts/deploy.sh production "${'$'}VERSION" "${variables.eksClusterName}" "${variables.ecrRegion}" "${variables.ecrRegistryBase}"
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
