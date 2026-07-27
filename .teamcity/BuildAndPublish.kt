import Common.commonFeatures
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.vcs

/**
 * Builds a multi-arch (amd64+arm64) Docker image and pushes it to ECR tagged
 * with the commit sha, `latest`, and `staging`. Runs on every push to main.
 */
object BuildAndPublish : BuildType({
    id("BuildAndPublish")
    name = "Build & Publish"
    description = "Builds a multi-arch image and pushes :<sha>, :latest, :staging to ECR"
    allowExternalStatus = true

    params {
        // Surfaced by build-and-push.sh via a TeamCity service message so
        // downstream deploy builds can reference the exact sha that was built.
        param("outputs.imageTag", "placeholder-replaced-by-build")
    }

    vcs {
        root(DslContext.settingsRoot)
        cleanCheckout = true
        branchFilter = "+:refs/heads/main"
    }

    triggers {
        vcs {
            branchFilter = "+:refs/heads/main"
        }
    }

    steps {
        script {
            name = "Build & push multi-arch image"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                deploy/scripts/build-and-push.sh "${variables.ecrRegistryBase}" "%build.vcs.number%" "${variables.dockerCacheBase}"
            """.trimIndent()
        }
    }

    failureConditions {
        executionTimeoutMin = 60
    }

    // Requires an agent with docker buildx + QEMU already configured for
    // multi-arch builds (`docker buildx create --use` with the qemu emulators).
    requirements {
        moreThan("teamcity.agent.hardware.memorySizeMb", "1000")
        equals("teamcity.agent.jvm.os.name", "Linux")
    }

    features {
        commonFeatures()
    }
})
