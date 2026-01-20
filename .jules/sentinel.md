## 2025-10-24 - innerHTML XSS in Electron with nodeIntegration

**Vulnerability:**
The application constructs HTML strings for `innerHTML` using unsanitized user inputs (e.g., settings values, file names, process names). This is particularly dangerous because the application runs with `nodeIntegration: true` and `contextIsolation: false`.

**Learning:**
Even with helper functions like `window._escapeHtml` available, developers may overlook using them when concatenating strings for the DOM. The combination of `innerHTML` and unrestricted Electron capabilities transforms simple XSS into Remote Code Execution (RCE).

**Prevention:**
1.  **Strict Sanitization:** Ensure *every* dynamic value injected into HTML is sanitized using `_escapeHtml` or a robust library like DOMPurify.
2.  **Architecture:** Transition towards `contextIsolation: true` and `nodeIntegration: false` to limit the impact of potential XSS vulnerabilities.
3.  **Code Practices:** Prefer `textContent` or `document.createElement()` over `innerHTML` string construction where possible.
