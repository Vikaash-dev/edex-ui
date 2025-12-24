function secureAction(path) {
    // 1. Escape backslashes (for JS string)
    // 2. Escape single quotes (for JS string)
    // 3. Escape double quotes (for HTML attribute)
    const sanitized = path.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
    return `window.writeFile('${sanitized}')`;
}

// Helper to simulate browser HTML attribute decoding
function decodeHTML(html) {
    return html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

console.log("--- Test Case 1: Simple Path ---");
const p1 = "test.txt";
const a1 = secureAction(p1);
const html1 = `onclick="${a1}"`;
console.log("Raw HTML:", html1);
console.log("Decoded JS:", decodeHTML(a1));
if (decodeHTML(a1) === "window.writeFile('test.txt')") console.log("✅ OK"); else console.log("❌ FAIL");

console.log("\n--- Test Case 2: Single Quote Injection ---");
const p2 = "foo'bar.txt";
const a2 = secureAction(p2);
const html2 = `onclick="${a2}"`;
console.log("Raw HTML:", html2);
console.log("Decoded JS:", decodeHTML(a2));
if (decodeHTML(a2) === "window.writeFile('foo\\'bar.txt')") console.log("✅ OK"); else console.log("❌ FAIL");

console.log("\n--- Test Case 3: Double Quote Injection (HTML Breakout) ---");
const p3 = 'foo"bar.txt';
const a3 = secureAction(p3);
const html3 = `onclick="${a3}"`;
console.log("Raw HTML:", html3);
// Check if raw HTML breaks
if (html3.startsWith('onclick="window.writeFile(\'foo&quot;bar.txt\')"')) console.log("✅ HTML Attribute OK"); else console.log("❌ FAIL HTML");
console.log("Decoded JS:", decodeHTML(a3));
if (decodeHTML(a3) === 'window.writeFile(\'foo"bar.txt\')') console.log("✅ JS OK"); else console.log("❌ FAIL JS");

console.log("\n--- Test Case 4: XSS via Double Quote ---");
const p4 = 'foo" onmouseover="alert(1)';
const a4 = secureAction(p4);
const html4 = `onclick="${a4}"`;
console.log("Raw HTML:", html4);
if (!html4.includes('onmouseover=')) console.log("✅ No XSS"); else console.log("❌ XSS Possible");

console.log("\n--- Test Case 5: Backslash ---");
const p5 = "C:\\Windows";
const a5 = secureAction(p5);
const html5 = `onclick="${a5}"`;
console.log("Raw HTML:", html5);
console.log("Decoded JS:", decodeHTML(a5));
if (decodeHTML(a5) === "window.writeFile('C:\\\\Windows')") console.log("✅ OK"); else console.log("❌ FAIL");
