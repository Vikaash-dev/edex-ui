## 2025-10-24 - Double Escaping for Inline Event Handlers
**Vulnerability:** DOM-based XSS in `FilesystemDisplay` via filenames. HTML entities in `onclick` attributes are decoded before JS execution, allowing execution of arbitrary code if filenames contain sequences like `");`.
**Learning:** `_escapeHtml` alone is insufficient when the escaped string is used inside a JavaScript string literal within an HTML attribute. The browser decodes HTML entities (like `&quot;` to `"`) *before* parsing the JavaScript.
**Prevention:** Use a two-step escaping process:
1.  Escape for JavaScript string context (`\` -> `\\`, `"` -> `\"`, `'` -> `\'`).
2.  Escape for HTML attribute context (`"` -> `&quot;`, `'` -> `&#039;`).
Helper function `_escapeStringForJS` was added to `_renderer.js` to handle the first step.
