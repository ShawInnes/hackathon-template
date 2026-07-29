import Common.commonFeatures
import Common.createKubeConfig
import Common.installKubectlEnvsubstAndHelm
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.vcs

/**
 * Promotes the current :staging image to a semver tag (no rebuild — retags
 * the exact bits that were validated in staging) and deploys it to production.
 *
 * Triggered by pushing a `vX.Y.Z` tag. Requires the VCS root's branch
 * specification to include `+:refs/tags/(v*)` — the parentheses make the
 * logical branch name `v1.2.3` (not `1.2.3`), which is what the filters below
 * and %teamcity.build.branch% both resolve against. Branch filters match
 * logical names, never full ref paths like `refs/tags/v1.2.3`.
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
        branchFilter = "+:v*"
    }

    triggers {
        vcs {
            branchFilter = "+:v*"
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
                VERSION="%teamcity.build.branch%"
                VERSION="${'$'}{VERSION#v}"
                deploy/scripts/deploy.sh production "${'$'}VERSION" "${variables.ecrRegistryBase}"
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
