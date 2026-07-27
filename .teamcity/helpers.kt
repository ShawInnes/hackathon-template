val variables = Variables()

fun asDependency(variableName: String, dependency: String) : String {
    return "%dep.${dependency}.${variableName}%";
}
