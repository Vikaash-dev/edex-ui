# Sentinel's Journal

## 2026-01-17 - DOM-based XSS via Event Handlers
**Vulnerability:** Found XSS in `FilesystemDisplay.render` where `e.path` was interpolated directly into `onclick` strings.
**Learning:** In Electron apps with `nodeIntegration`, `onclick` handlers generated via string concatenation are prime targets for XSS/RCE because escaping is often botched (HTML + JS contexts).
**Prevention:** Avoid embedding dynamic data in generated code strings. Use index-based lookups from a state array (e.g., `fsDisp.cwd[i].path`) to access data at runtime safely.
