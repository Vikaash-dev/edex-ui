## 2026-01-15 - Unrestricted System Information Access
**Vulnerability:** `_multithread.js` allowed the renderer process to invoke any method from the `systeminformation` library via IPC. This was exacerbated by an outdated version of the library (5.9.7) which had known command injection vulnerabilities.
**Learning:** Proxying entire libraries to the frontend without strict whitelisting expands the attack surface significantly, especially when the library interacts with the OS. Even if the frontend is "trusted", XSS can lead to RCE.
**Prevention:** Always whitelist allowed methods when exposing backend functionality to the frontend via IPC. Keep sensitive dependencies updated.
