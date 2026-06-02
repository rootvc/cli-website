#!/usr/bin/env node
// inject-site-nav.js — Inserts the site-wide meta-nav strip into the top of
// every drop's index.html (and the catalog page). The strip:
//   - Names the conceit ("root.vc — a venture firm reinvented every Monday")
//   - Links to the previous drop (chronologically) and the catalog
//   - Highlights "next: monday" (or the next drop if one exists)
//
// Idempotent: if the strip already exists (marker comment present), the file
// is re-written with the latest chain state — old content updated in place,
// not duplicated. Safe to run after every cycle.
//
// Invoked by the weekly workflow after rebuild-archive-index.js, and by hand:
//   node scripts/cycle/inject-site-nav.js

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ARCHIVE_DIR = path.join(REPO_ROOT, "archive");
const CHAIN_PATH = path.join(ARCHIVE_DIR, "chain.json");

const NAV_START_MARKER = "<!-- rv-site-nav:start -->";
const NAV_END_MARKER = "<!-- rv-site-nav:end -->";

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadChain() {
  if (!fs.existsSync(CHAIN_PATH)) {
    throw new Error(
      `chain.json not found at ${CHAIN_PATH} — run rebuild-archive-index.js first`
    );
  }
  return JSON.parse(fs.readFileSync(CHAIN_PATH, "utf8"));
}

function navCss() {
  // Inline-scoped styles so the strip survives any drop's CSS without leaking
  // into it. Black bar with monospace text — neutral and obviously "system."
  return `
.rv-site-nav,.rv-site-nav *,.rv-site-nav *:before,.rv-site-nav *:after{box-sizing:border-box;}
.rv-site-nav{position:sticky;top:0;left:0;right:0;z-index:2147483647;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;background:#0a0a0a;color:#e5e5e5;border-bottom:1px solid #2a2a2a;padding:8px 16px;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;letter-spacing:.02em;-webkit-font-smoothing:antialiased;}
.rv-site-nav a{color:inherit;text-decoration:none;}
.rv-site-nav__brand{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;}
.rv-site-nav__brand strong{font-weight:700;letter-spacing:.04em;}
.rv-site-nav__brand span{opacity:.55;}
.rv-site-nav__links{display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
.rv-site-nav__link{opacity:.9;padding:2px 0;}
.rv-site-nav__link:hover{opacity:1;text-decoration:underline;}
.rv-site-nav__link--catalog{font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:11px;}
.rv-site-nav__link--here{opacity:.45;cursor:default;border:1px dashed #444;padding:1px 6px;border-radius:3px;}
.rv-site-nav__link--disabled{opacity:.35;cursor:default;}
@media(max-width:600px){.rv-site-nav{padding:6px 10px;font-size:11px;}.rv-site-nav__brand span{display:none;}}
@media print{.rv-site-nav{display:none;}}
`.trim();
}

function navHtml({ chain, currentSlug, isCatalog }) {
  // Find current entry. If currentSlug is null and isCatalog is false, assume
  // the file is the live root deploy (which is the latest entry).
  let currentIdx;
  if (isCatalog) {
    currentIdx = -2; // sentinel
  } else if (currentSlug) {
    currentIdx = chain.findIndex((e) => e.slug === currentSlug);
    if (currentIdx === -1) currentIdx = chain.length - 1;
  } else {
    currentIdx = chain.length - 1;
  }

  const prev = currentIdx > 0 ? chain[currentIdx - 1] : null;
  const next =
    currentIdx >= 0 && currentIdx < chain.length - 1
      ? chain[currentIdx + 1]
      : null;

  let middleLinks = "";

  if (isCatalog) {
    const latest = chain[chain.length - 1];
    middleLinks = `<span class="rv-site-nav__link rv-site-nav__link--here">you are here: catalog</span>
        <a class="rv-site-nav__link" href="${escapeHtml(latest.url)}" title="${escapeHtml(latest.theme_name)}">jump to current drop →</a>`;
  } else {
    const prevPart = prev
      ? `<a class="rv-site-nav__link" href="${escapeHtml(prev.url)}" title="${escapeHtml(prev.theme_name)} (${escapeHtml(prev.date)})">← prev: ${escapeHtml(prev.theme_name)}</a>`
      : `<span class="rv-site-nav__link rv-site-nav__link--disabled">← (oldest)</span>`;
    const catalogPart = `<a class="rv-site-nav__link rv-site-nav__link--catalog" href="/archive/">all drops</a>`;
    const nextPart = next
      ? `<a class="rv-site-nav__link" href="${escapeHtml(next.url)}" title="${escapeHtml(next.theme_name)} (${escapeHtml(next.date)})">next: ${escapeHtml(next.theme_name)} →</a>`
      : `<span class="rv-site-nav__link rv-site-nav__link--disabled">next: monday →</span>`;
    middleLinks = `${prevPart}
        ${catalogPart}
        ${nextPart}`;
  }

  return `${NAV_START_MARKER}
<style>${navCss()}</style>
<header class="rv-site-nav" role="navigation" aria-label="Root Ventures site nav">
  <a class="rv-site-nav__brand" href="/">
    <strong>root.vc</strong>
    <span>a venture firm reinvented every monday</span>
  </a>
  <div class="rv-site-nav__links">
    ${middleLinks}
  </div>
</header>
${NAV_END_MARKER}`;
}

function injectIntoFile(filePath, { currentSlug = null, isCatalog = false }) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  skip (not found): ${filePath}`);
    return false;
  }
  let html = fs.readFileSync(filePath, "utf8");
  const chain = loadChain();
  const newNav = navHtml({ chain, currentSlug, isCatalog });

  if (html.includes(NAV_START_MARKER) && html.includes(NAV_END_MARKER)) {
    // Replace existing block in place — keeps the file idempotent under repeated runs.
    const before = html.split(NAV_START_MARKER)[0];
    const after = html.split(NAV_END_MARKER)[1];
    html = before + newNav + after;
  } else {
    // First-time inject: insert right after the opening <body> tag.
    const bodyMatch = html.match(/<body[^>]*>/i);
    if (!bodyMatch) {
      console.warn(`  skip (no <body>): ${filePath}`);
      return false;
    }
    const insertPoint = bodyMatch.index + bodyMatch[0].length;
    html =
      html.substring(0, insertPoint) +
      "\n" + newNav + "\n" +
      html.substring(insertPoint);
  }

  fs.writeFileSync(filePath, html);
  console.log(`  injected: ${path.relative(REPO_ROOT, filePath)}`);
  return true;
}

function injectAll() {
  const chain = loadChain();

  // Root index.html — the live drop. Treated as the latest chain entry.
  injectIntoFile(path.join(REPO_ROOT, "index.html"), { currentSlug: null });

  // Every dated drop under archive/YYYY-MM-DD/
  for (const entry of chain) {
    if (entry.legacy) continue;
    injectIntoFile(path.join(REPO_ROOT, "archive", entry.slug, "index.html"), {
      currentSlug: entry.slug,
    });
  }

  // Every legacy entry under archive/_legacy/<slug>/
  for (const entry of chain) {
    if (!entry.legacy) continue;
    injectIntoFile(path.join(REPO_ROOT, "archive/_legacy", entry.slug, "index.html"), {
      currentSlug: entry.slug,
    });
  }

  // Catalog page
  injectIntoFile(path.join(ARCHIVE_DIR, "index.html"), { isCatalog: true });
}

if (require.main === module) {
  injectAll();
}

module.exports = { injectAll, injectIntoFile, navHtml, NAV_START_MARKER, NAV_END_MARKER };
