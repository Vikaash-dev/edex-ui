## 2025-10-24 - Unrestricted IPC Access to System Information
**Vulnerability:** The application exposed the entire `systeminformation` API to the renderer process via a generic IPC proxy (`systeminformation-call`).
**Learning:** Generic IPC proxies that map string arguments directly to function calls on the backend are dangerous, especially with libraries that have powerful system access capabilities. Even if the library is patched, the design pattern itself violates the principle of least privilege.
**Prevention:** Always whitelist allowed methods in IPC handlers. Do not allow the renderer to specify the method name dynamically without validation.
