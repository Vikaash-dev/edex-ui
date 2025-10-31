# Security Fixes - Action Plan for eDEX-UI

## Quick Reference

**Total Vulnerabilities:** 34 (7 critical, 14 high, 11 moderate, 2 low)

---

## Immediate Actions (Can Fix Now)

### 1. Run npm audit fix (Non-Breaking)
These fixes can be applied immediately without breaking changes:

```bash
npm audit fix
```

This will fix:
- ansi-regex (high)
- brace-expansion
- cross-spawn (high)
- http-cache-semantics (high)
- json5 (high)
- qs (high)
- semver (high)
- tmp (low)
- json-schema (critical)
- minimist (critical)
- plist (critical)
- ejs (critical)

### 2. Update terser (High Priority)
```bash
npm update terser
```
- Current: 5.9.0
- Target: 5.44.0
- Fixes: ReDoS vulnerability (GHSA-4wf5-vphf-c2xc)
- Breaking: No

### 3. Update clean-css (Low Priority)
```bash
npm update clean-css
```
- Current: 5.2.1
- Target: 5.3.3
- Breaking: No

---

## Actions Requiring Breaking Changes

### 1. Update Electron (CRITICAL - Breaking Change)
```bash
npm install electron@latest
```
- Current: ^12.1.0 (12.2.2 installed)
- Target: 38.4.0
- Fixes: 10 high-severity vulnerabilities
- Breaking: YES - Major version change
- **Impact:** Requires code review and testing
- **Priority:** HIGH

**Affected vulnerabilities:**
- AutoUpdater bundle validation
- Child renderer IPC access
- SMB credentials exfiltration
- Bluetooth device access
- Out-of-package code execution
- Context isolation bypass
- libvpx heap buffer overflow
- ASAR Integrity bypass (multiple)
- Heap Buffer Overflow in NativeImage

### 2. Update electron-builder (HIGH - Breaking Change)
```bash
npm install electron-builder@latest
```
- Current: ^22.14.5
- Target: 26.0.12
- Fixes: NSIS installer code execution vulnerability
- Breaking: YES
- **Priority:** HIGH (especially for Windows builds)

### 3. Update electron-rebuild (MEDIUM - Breaking Change)
```bash
npm install electron-rebuild@latest
```
- Current: ^2.3.5
- Target: 3.2.9
- Fixes: form-data, tar, tough-cookie vulnerabilities
- Breaking: YES
- **Priority:** MEDIUM

---

## Build Compatibility Fixes

### Fix node-gyp Compatibility with Node.js v20

**Option 1: Update node-gyp (Recommended)**
```bash
npm install node-gyp@latest
```
Then update electron-rebuild which depends on it.

**Option 2: Use Node.js v14 (Matches Electron v12)**
```bash
nvm install 14
nvm use 14
```

**Option 3: Update node-pty in src/package.json**
Edit `src/package.json` and update:
```json
"node-pty": "0.10.1"  →  "node-pty": "^1.0.0"
```

---

## Step-by-Step Fix Guide

### Approach 1: Conservative (Minimal Changes)

```bash
# Step 1: Fix non-breaking vulnerabilities
npm audit fix

# Step 2: Update terser
npm update terser

# Step 3: Verify
npm audit

# Step 4: Test build
npm run start
```

**Expected Result:** Reduces vulnerabilities from 34 to ~23 (removes most critical/high)

### Approach 2: Moderate (Recommended)

```bash
# Step 1: Fix non-breaking vulnerabilities
npm audit fix

# Step 2: Update safe dependencies
npm update terser clean-css

# Step 3: Update node-gyp
npm install node-gyp@latest

# Step 4: Update electron-rebuild (fixes form-data, tar, tough-cookie)
npm install electron-rebuild@^3.2.9

# Step 5: Test installation
npm run install-linux  # or install-windows on Windows

# Step 6: Verify
npm audit

# Step 7: Test application
npm run start
```

**Expected Result:** Reduces vulnerabilities to ~15-20 (mostly electron-related)

### Approach 3: Aggressive (Full Update - Breaking Changes)

```bash
# Step 1: Backup current working state
git checkout -b backup-before-major-updates

# Step 2: Update all to latest
npm install electron@latest electron-builder@latest electron-rebuild@latest

# Step 3: Fix non-breaking vulnerabilities
npm audit fix

# Step 4: Update terser and other safe packages
npm update

# Step 5: Update src/package.json dependencies if needed
# Check for electron version compatibility

# Step 6: Rebuild native modules
npm run install-linux  # or install-windows

# Step 7: Test thoroughly
npm run start

# Step 8: Run full test suite if available
npm test
```

**Expected Result:** Reduces to 0-5 vulnerabilities, but requires extensive testing

---

## Testing Checklist

After applying fixes, test the following:

### Basic Functionality
- [ ] Application starts without errors
- [ ] Terminal opens and accepts commands
- [ ] File browser displays directories
- [ ] System monitor shows CPU/RAM usage
- [ ] Network monitor shows connections
- [ ] Keyboard input works
- [ ] Themes can be changed

### Advanced Features
- [ ] Multiple terminal tabs work
- [ ] Copy/paste functionality
- [ ] Full-screen mode
- [ ] Touch keyboard (if applicable)
- [ ] Sound effects (if enabled)
- [ ] Settings persistence

### Build Testing
- [ ] Development build works (`npm run start`)
- [ ] Production build completes (`npm run build-linux/windows/darwin`)
- [ ] Built application runs correctly
- [ ] No console errors in production

---

## Known Issues After Updates

### Electron v38 Changes
1. **Node.js integration:** May need to update security settings
2. **Context isolation:** Now enabled by default (breaking change)
3. **Remote module:** Deprecated, may need @electron/remote updates
4. **IPC changes:** Review IPC communication code

### electron-builder v26 Changes
1. **Configuration changes:** Review build configuration
2. **Target changes:** Some build targets may have changed
3. **Code signing:** Review signing configuration

---

## Code Quality Fixes (Non-Security)

### Remove Debug Statements
Search and replace/remove:
```bash
# Find console.log statements
grep -r "console\.log" src/ --include="*.js" | grep -v node_modules

# Recommended: Use a proper logging library instead
```

### Review innerHTML Usage
```bash
# Find all innerHTML assignments
grep -r "innerHTML\s*=" src/ --include="*.js" | grep -v node_modules

# Review each for XSS vulnerabilities
# Use textContent for plain text
# Use DOMPurify for HTML sanitization
```

---

## Automated Security Scanning

### GitHub Actions (Recommended)
Create `.github/workflows/security-audit.yml`:

```yaml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit
      - run: npm audit --json > audit-results.json
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: audit-results
          path: audit-results.json
```

### Dependabot Configuration
Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-username"
    labels:
      - "dependencies"
      - "security"
```

---

## Alternative: Create Security Advisory

If you cannot fix all vulnerabilities immediately, create a security advisory:

### SECURITY-ADVISORY.md
```markdown
# Security Advisory for eDEX-UI

## Known Vulnerabilities

This version of eDEX-UI contains known security vulnerabilities:
- Electron v12 (10 high-severity issues)
- Various dependency vulnerabilities

## Recommendations
1. Use in isolated/sandboxed environments
2. Do not use for sensitive operations
3. Do not run untrusted code
4. Keep system firewall enabled
5. Monitor for suspicious activity

## Mitigation
- Use latest available version
- Follow security best practices
- Consider forking and updating dependencies

## For Developers
See SECURITY_FIXES.md for detailed fix instructions.
```

---

## Verification Commands

After applying fixes:

```bash
# Check current vulnerability count
npm audit

# Check for outdated packages
npm outdated

# Verify application starts
npm run start

# Check build process
npm run build-linux  # or build-darwin, build-windows

# View dependency tree
npm list --depth=0

# Check for deprecated packages
npm list --depth=0 2>&1 | grep deprecated
```

---

## Support and Resources

### Documentation
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Electron security guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP Node.js security](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### Security Advisories
- [GitHub Advisory Database](https://github.com/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Snyk Vulnerability Database](https://security.snyk.io/)

---

## Contact

For security issues in eDEX-UI, please:
1. Check existing issues on GitHub
2. Review SECURITY.md in the repository
3. Consider forking and maintaining your own secure version

---

**Last Updated:** October 24, 2025
**Scan Tool:** npm audit v10.8.2
