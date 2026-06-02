#!/usr/bin/env node
// rebuild-archive-index.js — Walks archive/ for every entry (both legacy
// and dated weekly drops), reads each meta.json, and writes a chronological
// catalog at archive/index.html. Invoked by the weekly cycle after a new
// drop lands, and can also be run by hand: `node scripts/cycle/rebuild-archive-index.js`.
//
// Sort order: newest first. Legacy entries use date_first_shipped; dated
// drops use the directory name (YYYY-MM-DD).
//
// Also computes the chronological prev/next chain across all entries so
// individual drops can render "last week's model" / "next week's model"
// links if they want — the chain is exposed as a JSON payload at
// archive/chain.json so the orchestrator can pass previous_drop_url into
// the Author's prompt for the next cycle.

const fs = require("node:fs");
const path = require("node:path");

const ARCHIVE_DIR = path.resolve(__dirname, "..", "..", "archive");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function listEntries() {
  const entries = [];
  if (!fs.existsSync(ARCHIVE_DIR)) return entries;

  // Dated weekly drops at archive/YYYY-MM-DD/
  for (const name of fs.readdirSync(ARCHIVE_DIR)) {
    if (!DATE_RE.test(name)) continue;
    const dir = path.join(ARCHIVE_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const metaPath = path.join(dir, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    entries.push({
      slug: name,
      url: `/archive/${name}/`,
      date: name,
      sortKey: name,
      legacy: false,
      meta,
    });
  }

  // Legacy entries at archive/_legacy/<slug>/
  const legacyDir = path.join(ARCHIVE_DIR, "_legacy");
  if (fs.existsSync(legacyDir)) {
    for (const name of fs.readdirSync(legacyDir)) {
      const dir = path.join(legacyDir, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      const metaPath = path.join(dir, "meta.json");
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      entries.push({
        slug: name,
        url: `/archive/_legacy/${name}/`,
        date: meta.date_first_shipped || "1970-01-01",
        sortKey: meta.date_first_shipped || `0000-${meta.sort_order || 0}`,
        legacy: true,
        meta,
      });
    }
  }

  return entries;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildIndexHtml(entries) {
  // Newest first
  const sortedDesc = [...entries].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const items = sortedDesc
    .map((e, i) => {
      const meta = e.meta || {};
      const isMostRecent = i === 0;
      const themeName = escapeHtml(meta.theme_name || e.slug);
      const editorial = escapeHtml((meta.editorial_note || "").slice(0, 320) +
        (meta.editorial_note && meta.editorial_note.length > 320 ? "…" : ""));
      const dateLabel = escapeHtml(e.date);
      const tag = e.legacy ? "Legacy" : "Drop";
      const recentBadge = isMostRecent ? '<span class="badge current">Current</span>' : "";
      return `
        <li class="entry${e.legacy ? " is-legacy" : ""}${isMostRecent ? " is-current" : ""}">
          <a class="entry-link" href="${escapeHtml(e.url)}">
            <div class="row">
              <span class="date">${dateLabel}</span>
              <span class="tag">${tag}</span>
              ${recentBadge}
            </div>
            <h2 class="theme">${themeName}</h2>
            <p class="note">${editorial}</p>
          </a>
        </li>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="shortcut icon" href="/favicon.png" />
  <title>root.vc · archive</title>
  <meta name="description" content="The catalog of past Root Ventures drops. Every weekly reinvention. Never recycled." />
  <meta name="robots" content="noindex" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      background: #f6f4ee;
      color: #1a1a1a;
      padding: 48px 24px;
    }
    .wrap { max-width: 760px; margin: 0 auto; }
    header { margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a; }
    .breadcrumbs { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
    .breadcrumbs a { color: inherit; }
    h1 { font-size: 32px; margin: 0 0 8px; letter-spacing: -0.5px; font-weight: 700; }
    header p { margin: 0; opacity: 0.7; font-size: 14px; line-height: 1.6; }
    ul.entries { list-style: none; margin: 0; padding: 0; }
    .entry { margin: 0; padding: 0; border-bottom: 1px solid #d9d5c9; }
    .entry-link {
      display: block;
      padding: 24px 0;
      color: inherit;
      text-decoration: none;
      transition: background 0.1s ease;
    }
    .entry-link:hover { background: rgba(0,0,0,0.03); }
    .row { display: flex; gap: 12px; align-items: center; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin-bottom: 8px; opacity: 0.85; }
    .date { letter-spacing: 0.5px; }
    .tag { padding: 2px 8px; border: 1px solid currentColor; border-radius: 3px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; opacity: 0.7; }
    .badge.current { background: #1a1a1a; color: #f6f4ee; padding: 2px 8px; border-radius: 3px; font-size: 10px; letter-spacing: 0.5px; }
    h2.theme { font-size: 22px; margin: 0 0 6px; font-weight: 600; }
    p.note { margin: 0; font-size: 14px; opacity: 0.75; line-height: 1.55; }
    .entry.is-legacy h2.theme { font-style: italic; }
    footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid #d9d5c9; font-size: 12px; opacity: 0.55; }
  </style>
</head>
<body>
  <main class="wrap">
    <header>
      <p class="breadcrumbs"><a href="/">root.vc</a> / archive</p>
      <h1>archive</h1>
      <p>Every reinvention of root.vc, in order. New drops every Monday. Past drops never recycled — open one and it loads as it shipped that week.</p>
    </header>
    <ul class="entries">
${items}
    </ul>
    <footer>
      <p>Root Ventures · hello@root.vc · 2670 Harrison St, San Francisco, CA 94110 · Est. 2015</p>
    </footer>
  </main>
</body>
</html>
`;
}

function buildChainJson(entries) {
  // Oldest-first so prev/next match chronological order.
  const sortedAsc = [...entries].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return sortedAsc.map((e, i) => {
    const prev = i > 0 ? sortedAsc[i - 1] : null;
    const next = i < sortedAsc.length - 1 ? sortedAsc[i + 1] : null;
    return {
      slug: e.slug,
      url: e.url,
      date: e.date,
      legacy: e.legacy,
      theme_name: e.meta && e.meta.theme_name,
      prev: prev && { slug: prev.slug, url: prev.url, theme_name: prev.meta && prev.meta.theme_name, date: prev.date },
      next: next && { slug: next.slug, url: next.url, theme_name: next.meta && next.meta.theme_name, date: next.date },
    };
  });
}

function main() {
  const entries = listEntries();
  if (entries.length === 0) {
    console.error("No archive entries found at", ARCHIVE_DIR);
    process.exit(1);
  }
  const html = buildIndexHtml(entries);
  const chain = buildChainJson(entries);

  const indexPath = path.join(ARCHIVE_DIR, "index.html");
  fs.writeFileSync(indexPath, html);

  const chainPath = path.join(ARCHIVE_DIR, "chain.json");
  fs.writeFileSync(chainPath, JSON.stringify(chain, null, 2));

  console.log(`Wrote ${indexPath} (${entries.length} entries)`);
  console.log(`Wrote ${chainPath}`);
}

if (require.main === module) main();
module.exports = { listEntries, buildIndexHtml, buildChainJson };
