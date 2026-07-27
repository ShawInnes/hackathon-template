import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.projectFeatures.dockerECRRegistry

/*
The settings script is an entry point for defining a TeamCity
project hierarchy. The script should contain a single call to the
project() function with a Project instance or an init function as
an argument.

To debug settings scripts in command-line, run the

    mvnDebug org.jetbrains.teamcity:teamcity-configs-maven-plugin:generate

command and attach your debugger to the port 8000.
*/

version = "2025.03"

project {
    // These params get shared down to the build types below. Override any of
    // them per-instance in the TeamCity UI without touching this file.
    params {
        param("build.branchFilter", "+:*")
        // The underlying VCS root's own Branch Specification (configured on
        // the server) must also include `+:refs/tags/(v*)` for tag pushes to
        // resolve %teamcity.build.branch% to the bare version in DeployProduction.
        param(
            "build.branchSpecification",
            """
                +:refs/heads/(*)
                +:refs/tags/(v*)
            """.trimIndent(),
        )

        // AUTH_SECRET passthrough for each environment — blank by default so a
        // fresh deploy doesn't clobber whatever secret is already in the
        // cluster. Fill in via the TeamCity UI (Edit Configuration > Parameters).
        password("staging.authSecret", "")
        password("production.authSecret", "")
    }

    buildType(BuildAndPublish)
    buildType(DeployStaging)
    buildType(DeployProduction)

    features {
        dockerECRRegistry {
            id = variables.ecrConnectionName
            displayName = "Amazon ECR"
            registryId = variables.ecrAccountNumber
            credentialsProvider = defaultCredentialsProvider()
            regionCode = variables.ecrRegion
            credentialsType = accessKeys()
        }
    }
}
