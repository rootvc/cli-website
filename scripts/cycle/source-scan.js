// source-scan.js — DC11 deny-list regex applied to every .js file in a
// generated artifact directory. Rejects patterns that signal outbound
// network calls, dynamic script injection, or CSP overrides.
//
// Invoked by:
//   - tests/cycle/source-scan.test.js (Vitest smoke gate)
//   - scripts/cycle/run-cycle.js (orchestrator's pre-ship gate)
//
// Returns { violations: [...], scannedFiles: number }. Empty violations
// means pass; any entries mean fail.
//
// The artifact's HTML can also be scanned for <meta http-equiv> CSP overrides
// (a way to bypass the deploy-level CSP). That check is in scanHtml().

const fs = require("node:fs");
const path = require("node:path");

// Deny-list patterns. Each entry is { regex, label, suggestedFix }.
// Patterns deliberately err on the side of false positives — the Author
// shouldn't be using these without an explicit case-by-case waiver, which
// v1 doesn't support.
const JS_DENY_LIST = [
  {
    regex: /\bfetch\s*\(/g,
    label: "outbound fetch()",
    suggestedFix: "Anchor facts must be static-HTML present; remove the fetch call",
  },
  {
    regex: /\bnew\s+XMLHttpRequest\b/g,
    label: "XMLHttpRequest constructor",
    suggestedFix: "Network calls are not allowed in shipped artifacts",
  },
  {
    regex: /\bnew\s+WebSocket\b/g,
    label: "WebSocket constructor",
    suggestedFix: "Long-lived connections are not allowed in shipped artifacts",
  },
  {
    regex: /navigator\.sendBeacon\b/g,
    label: "navigator.sendBeacon",
    suggestedFix: "Beacon-style telemetry is not allowed",
  },
  {
    regex: /document\.createElement\s*\(\s*['"`]script['"`]\s*\)/g,
    label: "dynamic <script> creation",
    suggestedFix: "Inline JS only; no dynamic script-tag injection",
  },
  {
    regex: /document\.write\s*\(/g,
    label: "document.write",
    suggestedFix: "document.write is forbidden",
  },
  {
    regex: /\beval\s*\(/g,
    label: "eval()",
    suggestedFix: "Dynamic code execution is forbidden",
  },
  {
    regex: /\bnew\s+Function\s*\(/g,
    label: "Function constructor",
    suggestedFix: "Dynamic function construction is forbidden",
  },
];

const HTML_DENY_LIST = [
  {
    regex: /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["']/gi,
    label: "<meta http-equiv=\"Content-Security-Policy\"> override",
    suggestedFix: "CSP must be set by Vercel headers, not overridden in the artifact",
  },
];

function scanJs(absolutePath, relativePath) {
  const source = fs.readFileSync(absolutePath, "utf8");
  const violations = [];
  for (const rule of JS_DENY_LIST) {
    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(source)) !== null) {
      const before = source.substring(0, match.index);
      const lineNumber = before.split("\n").length;
      violations.push({
        file: relativePath,
        line: lineNumber,
        snippet: match[0],
        label: rule.label,
        suggestedFix: rule.suggestedFix,
      });
    }
  }
  return violations;
}

function scanHtml(absolutePath, relativePath) {
  const source = fs.readFileSync(absolutePath, "utf8");
  const violations = [];
  for (const rule of HTML_DENY_LIST) {
    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(source)) !== null) {
      const before = source.substring(0, match.index);
      const lineNumber = before.split("\n").length;
      violations.push({
        file: relativePath,
        line: lineNumber,
        snippet: match[0].substring(0, 100),
        label: rule.label,
        suggestedFix: rule.suggestedFix,
      });
    }
  }
  return violations;
}

function scanArtifact(artifactPath, options = {}) {
  // Skip vendored libraries (e.g. xterm.js, addon-fit.js) — these are known
  // upstream code, scanned via dependency review, not via this deny-list.
  // Skipped patterns can be extended via options.skipPatterns.
  const skipPatterns = (options.skipPatterns || []).concat([
    /\/xterm\.js$/,
    /\/addon-fit\.js$/,
    /\/addon-web-links\.js$/,
    /\/aalib\.js$/,
    /\.min\.js$/,
  ]);

  const violations = [];
  let scannedFiles = 0;

  function walk(dir, rel = "") {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relPath = path.join(rel, entry.name);
      if (entry.isDirectory()) {
        walk(full, relPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const skip = skipPatterns.some((p) => p.test(relPath));
      if (skip) continue;

      if (entry.name.endsWith(".js")) {
        violations.push(...scanJs(full, relPath));
        scannedFiles++;
      } else if (entry.name.endsWith(".html") || entry.name.endsWith(".htm")) {
        violations.push(...scanHtml(full, relPath));
        scannedFiles++;
      }
    }
  }

  walk(artifactPath);
  return { violations, scannedFiles };
}

module.exports = {
  scanArtifact,
  scanJs,
  scanHtml,
  JS_DENY_LIST,
  HTML_DENY_LIST,
};
