---
description: Devcontainer conventions — triggers when modifying devcontainer config, adding native binary dependencies, or troubleshooting container builds
globs: [".devcontainer/**", "package.json"]
---

# Devcontainer

- The devcontainer mounts the host `node_modules` via volume. Native binary packages installed on macOS won't have their Linux ARM64 variants present in the container.
- Fix: add the Linux ARM64 package as an explicit `optionalDependencies` entry (e.g. `lightningcss-linux-arm64-gnu`). npm will then include it in `package-lock.json` and install it inside the container.
