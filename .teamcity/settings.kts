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
    // The VCS default branch drives builds and automatic staging deployments.
    // Production is promoted manually from a successful staging snapshot.

    buildType(BuildAndPublish)
    buildType(DeployStaging)
    buildType(DeployProduction)
}
