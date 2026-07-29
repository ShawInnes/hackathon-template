import jetbrains.buildServer.configs.kotlin.*

/*
The settings script is an entry point for defining a TeamCity
project hierarchy. The script should contain a single call to the
project() function with a Project instance or an init function as
an argument.

To debug settings scripts in command-line, run the

    mvnDebug org.jetbrains.teamcity:teamcity-configs-maven-plugin:generate

command and attach your debugger to the port 8000.
*/

version = "2025.11"

project {
    // These params get shared down to the build types below. Override any of
    // them per-instance in the TeamCity UI without touching this file.
    //
    // Branch specification is NOT configured here — it lives on the VCS root
    // itself and must include `+:refs/tags/(v*)` for DeployProduction's tag
    // trigger to match. Each build type sets its own branchFilter, which
    // matches logical branch names (`main`, `v1.2.3`), never full ref paths.
    params {
    }

    buildType(BuildAndPublish)
    buildType(DeployStaging)
    buildType(DeployProduction)
}
