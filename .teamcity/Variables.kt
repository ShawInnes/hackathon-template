// Infra config surface for the pipeline. AWS_ACCOUNT_ID / AWS_REGION are
// TeamCity project parameters inherited from parent project, and PROJECT_EXT_163 is
// the shared "Amazon ECR" connection configured at that same level
// — nothing here needs a per-subproject Context Parameter any more. EKS
// access for the deploy build types comes from the KUBECONFIG_B64 secret
// (also inherited from parent project), not an AWS connection. App name is derived
// at build time from the git remote (see deploy/scripts/lib.sh).
open class Variables {
    // ECR
    val ecrRegistryBase = "%AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com"
    val dockerCacheBase = "${ecrRegistryBase}/teamcity/build-cache"
    val ecrConnectionName = "PROJECT_EXT_163"

    // Helm
    val chartPath = "deploy/chart"
}
