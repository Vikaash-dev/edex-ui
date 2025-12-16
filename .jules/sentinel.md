## 2024-02-14 - Fix UpdateChecker XSS and RCE
**Vulnerability:** The `UpdateChecker` class was taking `tag_name` and `html_url` from the GitHub API and injecting them directly into the HTML of a `Modal`. This allowed for Stored XSS via `tag_name` and potential Remote Code Execution (RCE) via `html_url` injection into the `onclick` attribute (if the API response was compromised or manipulated).
**Learning:** Even "trusted" APIs like GitHub's can be a source of malicious input if compromised, or if DNS is spoofed. Always sanitize data before injecting it into the DOM, especially when using `onclick` with string interpolation.
**Prevention:**
1.  Use `window._escapeHtml()` for any text displayed in HTML.
2.  Validate and normalize URLs using `new URL()` and `url.href`.
3.  Check protocol and hostname for URLs that trigger sensitive actions.
4.  Correctly escape quotes when interpolating strings into JavaScript contexts within HTML attributes.
