package Common

import jetbrains.buildServer.configs.kotlin.BuildFeatures
import jetbrains.buildServer.configs.kotlin.BuildType
import jetbrains.buildServer.configs.kotlin.Dependencies
import jetbrains.buildServer.configs.kotlin.FailureAction
import jetbrains.buildServer.configs.kotlin.SnapshotDependency
import jetbrains.buildServer.configs.kotlin.buildFeatures.dockerRegistryConnections
import jetbrains.buildServer.configs.kotlin.buildFeatures.perfmon
import jetbrains.buildServer.configs.kotlin.buildFeatures.provideAwsCredentials
import variables

/**
 * Snapshot dependency that fails/cancels this build if the dependency build
 * fails or is cancelled, instead of silently running against stale artifacts.
 */
fun Dependencies.mandatorySnapshot(buildType: BuildType, init: SnapshotDependency.() -> Unit) {
    snapshot(buildType) {
        init(this)
        onDependencyFailure = FailureAction.FAIL_TO_START
        onDependencyCancel = FailureAction.CANCEL
    }
}

/**
 * Features shared by every build/deploy step in this pipeline: perf metrics,
 * ECR login (for docker/helm steps that pull or push images), and the AWS
 * credentials needed to talk to ECR/EKS.
 */
fun BuildFeatures.commonFeatures() {
    perfmon {}

    provideAwsCredentials {
        awsConnectionId = variables.awsConnectionId
    }

    dockerRegistryConnections {
        loginToRegistry = on {
            dockerRegistryId = variables.ecrConnectionName
        }
    }
}
