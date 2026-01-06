# Sentinel Journal
## 2026-01-06 - Native Dependency Build Failures in CI
**Vulnerability:** Not a vulnerability, but a blocker for security updates. `node-pty` failed to build on Node 22, preventing `npm install`.
**Learning:** Native modules in Electron apps often lag behind Node.js versions. `node-pty` 0.10.1 is incompatible with Node 22+ due to C++ API changes in V8/Node.
**Prevention:** When updating dependencies in an environment with a newer Node version than the project supports, use `npm install --ignore-scripts` to bypass native builds if you only need to update the lockfile/JS dependencies.
