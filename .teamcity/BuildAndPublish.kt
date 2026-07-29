import Common.commonFeatures
import Common.createKubeConfig
import Common.installKubectlAndEnvsubst
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.vcs

/**
 * Ensures the app's namespace and Crossplane-managed ECR repository exist,
 * then builds an amd64 Docker image and pushes it to ECR tagged with the
 * commit sha, `latest`, and `staging`. Runs on every push to main.
 */
object BuildAndPublish : BuildType({
    id("BuildAndPublish")
    name = "Build & Publish"
    description = "Builds an amd64 image and pushes :<sha>, :latest, :staging to ECR"
    allowExternalStatus = true

    params {
        // Surfaced by build-and-push.sh via a TeamCity service message so
        // downstream deploy builds can reference the exact sha that was built.
        param("outputs.imageTag", "placeholder-replaced-by-build")
    }

    vcs {
        root(DslContext.settingsRoot)
        cleanCheckout = true
        branchFilter = "+:<default>"
    }

    triggers {
        vcs {
            branchFilter = "+:<default>"
        }
    }

    steps {
        installKubectlAndEnvsubst()
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
            name = "Ensure ECR repository exists"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                deploy/scripts/ensure-ecr.sh
            """.trimIndent()
        }
        script {
            name = "Build & push amd64 image"
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

    // Pinned to an amd64 agent so the build runs natively — no QEMU
    // emulation. Building the amd64 target under QEMU on an arm64 agent
    // previously segfaulted during `next build` (native SWC/esbuild binaries
    // aren't reliable under emulation).
    requirements {
        moreThan("teamcity.agent.hardware.memorySizeMb", "1000")
        equals("teamcity.agent.jvm.os.name", "Linux")
        equals("teamcity.agent.jvm.os.arch", "amd64")
    }

    features {
        commonFeatures()
    }
})
