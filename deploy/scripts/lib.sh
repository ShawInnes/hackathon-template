# Shared helpers for deploy/scripts/*.sh. Source, don't execute.

# Derive the app name from the git remote: repo basename, sans ".git" and the
# legacy "t1-" prefix used by the old shared TeamCity project. This is the one
# place app-specific naming is derived — every script and the Helm release
# name/namespace follow from it, so forking this template requires no edits
# here.
app_name() {
  local url name
  url="$(git config --get remote.origin.url)"
  name="$(basename "${url%.git}")"
  printf '%s' "${name#t1-}"
}
