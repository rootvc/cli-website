import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./browser-env.js";

// Loads an archive directory's index.html + referenced JS/CSS into a JSDOM
// window with no-op polyfills for browser APIs that JSDOM doesn't implement
// (per DC13). The cycle's smoke tests use this to assert against a fresh
// /archive/YYYY-MM-DD/ before shipping; ordinary CI runs use it against the
// /cli/ snapshot.
//
// ARTIFACT_PATH is the directory containing index.html, meta.json, and asset
// files. Paths inside index.html should resolve relative to that directory.

const NOOP_OBSERVER = `(function () {
  function NoOpObserver() {
    return {
      observe: function () {},
      disconnect: function () {},
      unobserve: function () {},
      takeRecords: function () { return []; },
    };
  }
  if (typeof window !== "undefined") {
    if (!window.IntersectionObserver) window.IntersectionObserver = NoOpObserver;
    if (!window.ResizeObserver) window.ResizeObserver = NoOpObserver;
    if (!window.MutationObserver) window.MutationObserver = NoOpObserver;
    if (typeof window.requestIdleCallback !== "function") {
      window.requestIdleCallback = function (cb) { return setTimeout(cb, 0); };
    }
  }
})();`;

export function resolveArtifactPath(input) {
  if (!input) return null;
  return path.isAbsolute(input) ? input : path.join(REPO_ROOT, input);
}

export function readArtifactMeta(artifactPath) {
  const metaPath = path.join(artifactPath, "meta.json");
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, "utf8"));
}

export function listArtifactFiles(artifactPath) {
  const out = [];
  function walk(dir, rel = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relPath = path.join(rel, entry.name);
      if (entry.isDirectory()) {
        walk(full, relPath);
      } else if (entry.isFile()) {
        out.push({ absolute: full, relative: relPath, size: fs.statSync(full).size });
      }
    }
  }
  if (fs.existsSync(artifactPath)) walk(artifactPath);
  return out;
}

export function loadArtifactDom(artifactPath, options = {}) {
  const indexPath = path.join(artifactPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`No index.html at ${indexPath}`);
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const baseUrl = options.url || "https://www.root.vc/";

  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: "dangerously",
    url: baseUrl,
    resources: "usable",
  });
  const { window } = dom;
  window.console = console;

  // Polyfill modern browser APIs JSDOM doesn't implement (DC13).
  const polyfillScript = window.document.createElement("script");
  polyfillScript.textContent = NOOP_OBSERVER;
  window.document.head.insertBefore(polyfillScript, window.document.head.firstChild);

  // Track any console errors that fire during initial render so structural
  // tests can assert against them with an allowlist.
  const consoleErrors = [];
  const originalError = window.console.error;
  window.console.error = (...args) => {
    consoleErrors.push(args.map(String).join(" "));
    originalError.apply(window.console, args);
  };

  // Load referenced JS files as inline script tags (matches browser-env.js
  // pattern). This bypasses JSDOM's resources fetcher (which can be flaky in
  // unit tests) and avoids network calls.
  const scriptSrcs = Array.from(
    window.document.querySelectorAll("script[src]")
  ).map((s) => s.getAttribute("src"));

  for (const src of scriptSrcs) {
    const fsPath = resolveScriptPath(artifactPath, src);
    if (!fsPath || !fs.existsSync(fsPath)) continue;
    const source = fs.readFileSync(fsPath, "utf8");
    const inline = window.document.createElement("script");
    inline.textContent = `${source}\n//# sourceURL=${src}`;
    window.document.head.appendChild(inline);
  }

  function cleanup() {
    window.console.error = originalError;
    window.close();
  }

  return { dom, window, document: window.document, consoleErrors, cleanup };
}

// Resolve a script `src` attribute (which may be relative, absolute root-anchored,
// or a full URL) to a filesystem path within the artifact directory. Returns null
// for absolute root-anchored paths (e.g. /js/foo.js) — those reference the live
// site root, not the artifact, and are intentionally not loaded by the smoke tests.
function resolveScriptPath(artifactPath, src) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
    return null;
  }
  if (src.startsWith("/")) {
    // Root-anchored — points to the live site, not the artifact. Skip.
    return null;
  }
  const cleaned = src.replace(/^\.\//, "");
  return path.join(artifactPath, cleaned);
}
