## 2025-10-24 - Unrestricted IPC to systeminformation
**Vulnerability:** The `src/_multithread.js` file exposed the entire `systeminformation` library API via IPC to the renderer process, allowing execution of arbitrary methods including those with command injection risks. Additionally, the library version was outdated (5.9.7) and vulnerable.
**Learning:** Relying on checks like `if (!si[type])` is insufficient for security boundaries. It only validates existence, not safety. IPC interfaces act as API endpoints and must have strict schema validation and whitelisting.
**Prevention:** Always implement an explicit whitelist (`ALLOWED_METHODS`) for IPC handlers that proxy method calls. Pin security-critical dependencies and update them regularly.
