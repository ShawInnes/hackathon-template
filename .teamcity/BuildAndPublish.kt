import Common.commonFeatures
import Common.createKubeConfig
import Common.installKubectlAndEnvsubst
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.DslContext
import jetbrains.buildServer.configs.kotlin.buildFeatures.vcsLabeling
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.vcs

/**
 * Ensures the app's namespace and Crossplane-managed ECR repository exist,
 * then builds an amd64 Docker image and pushes it to ECR tagged with the
 * commit sha, `latest`, `staging`, and the build version. Runs on every push
 * to main.
 *
 * The build number (major.minor read from package.json, patch from
 * TeamCity's build counter) is minted by the first step below via the
 * `##teamcity[buildNumber ...]` service message. package.json can't be read
 * from the DSL config script itself — TeamCity sandboxes settings
 * generation to the .teamcity/ directory — so the read has to happen on the
 * agent at build time instead. That version is carried through the whole
 * pipeline: stamped on the image, the git tag, and ultimately what
 * DeployProduction promotes. Minting it here (rather than at promotion
 * time) means nobody has to invent or push a semver tag by hand; the VCS
 * Labeling feature below tags the commit automatically once the build
 * succeeds.
 */
object BuildAndPublish : BuildType({
    id("BuildAndPublish")
    name = "Build & Publish"
    description = "Builds an amd64 image and pushes :<sha>, :latest, :staging, :<version> to ECR"
    allowExternalStatus = true

    params {
        // Surfaced by build-and-push.sh via TeamCity service messages so
        // downstream deploy builds can reference the exact sha and version
        // that were built.
        param("outputs.imageTag", "placeholder-replaced-by-build")
        param("outputs.version", "placeholder-replaced-by-build")
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
        script {
            // Reading package.json from the .teamcity Kotlin script itself
            // isn't possible — TeamCity's DSL settings generation runs
            // server-side in a sandbox that only permits file access within
            // .teamcity/, so this has to happen here, on the agent, instead.
            name = "Set build version from package.json"
            scriptContent = """
                #!/usr/bin/env bash
                set -euo pipefail
                VERSION_PREFIX="$(grep -m1 '"version"' package.json | sed -E 's/^[^"]*"version"[^"]*"([0-9]+)\.([0-9]+)\.[0-9]+".*$/\1.\2/')"
                echo "##teamcity[buildNumber '${'$'}{VERSION_PREFIX}.%build.counter%']"
            """.trimIndent()
        }
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
                deploy/scripts/build-and-push.sh "${variables.ecrRegistryBase}" "%build.vcs.number%" "%build.number%" "${variables.dockerCacheBase}"
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
        vcsLabeling {
            vcsRootId = "${DslContext.settingsRoot.id}"
            labelingPattern = "v%build.number%"
            successfulOnly = true
            branchFilter = "+:<default>"
        }
    }
})
