import jetbrains.buildServer.configs.kotlin.DslContext

// Infra config surface for the pipeline. Every environment-specific value
// (account IDs, connection IDs, cluster names) is resolved from a TeamCity
// Context Parameter — Administration > this project > Versioned Settings >
// Context Parameters — never hardcoded here. App name is derived at build
// time from the git remote (see deploy/scripts/lib.sh), so nothing
// app-specific lives here either.
open class Variables {
    // ECR
    val ecrAccountNumber = DslContext.getParameter("EcrAccountNumber")
    val ecrRegion = "ap-southeast-2"
    val ecrRegistryBase = "${ecrAccountNumber}.dkr.ecr.${ecrRegion}.amazonaws.com"
    val dockerCacheBase = "${ecrRegistryBase}/teamcity/build-cache"
    val ecrConnectionName = DslContext.getParameter("EcrConnectionName")

    // AWS credentials connection id (TeamCity project-level AWS connection, configured on the server)
    val awsConnectionId = DslContext.getParameter("AwsConnectionId")

    // EKS — target cluster for the deploy build types
    val eksClusterName = DslContext.getParameter("EksClusterName")

    // Helm
    val chartPath = "deploy/chart"
}
