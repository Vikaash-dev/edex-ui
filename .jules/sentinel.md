## 2026-01-19 - SystemInformation IPC Allowlist
**Vulnerability:** Unrestricted access to `systeminformation` API via IPC from renderer process.
**Learning:** Even with secure dependencies, exposing full APIs to the renderer (which has a large attack surface) defeats the purpose of privilege separation.
**Prevention:** Always implement strict allowlists (whitelists) for IPC messages that proxy backend functionality.
