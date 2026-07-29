import jetbrains.buildServer.configs.kotlin.DslContext

val variables = Variables()

/**
 * Resolves a DSL-relative build configuration id (the string passed to
 * `id("...")`) to the absolute external id TeamCity actually uses.
 *
 * This DSL is portable, so `id("BuildAndPublish")` is relative and the real
 * external id is `<projectId>_BuildAndPublish`. Anything that references a
 * build configuration by *string* rather than by object — `%dep.<id>.<param>%`
 * references, finish-build triggers — needs the absolute form. With a relative
 * id TeamCity fails silently: the trigger never fires, and the parameter
 * reference makes the build fail to start with "Unresolved referenced
 * parameter".
 */
fun absoluteId(relativeBuildTypeId: String): String =
    "${DslContext.projectId.value}_$relativeBuildTypeId"

fun asDependency(variableName: String, dependency: String): String {
    return "%dep.${absoluteId(dependency)}.${variableName}%"
}
