## 2026-01-05 - Double-Layer Sanitization for Inline Handlers
**Vulnerability:** DOM-based XSS in `filesystem.class.js` where filenames containing quotes (e.g., `foo'bar.json`) broke out of JavaScript string literals inside `onclick` attributes.
**Learning:** `window._escapeHtml` alone is insufficient when data is placed inside a JavaScript string *within* an HTML attribute. HTML entity decoding happens before JavaScript parsing, so `&quot;` becomes `"` which can close the JS string.
**Prevention:** Use a two-step escaping process:
1. Escape the data for JavaScript string context (`\`, `'`, `"`, newline) using `window._escapeStringForJS`.
2. Escape the resulting code string for HTML attribute context using `window._escapeHtml`.
