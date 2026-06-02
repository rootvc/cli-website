#!/usr/bin/env node
// rebuild-archive-index.js — Walks archive/ for every incarnation (both legacy
// and dated weekly cycles), reads each meta.json, and writes:
//   - archive/index.html   — the Wayback-Machine-parody catalog
//   - archive/chain.json   — prev/next chain for use by per-theme top nav
//
// Each incarnation is treated as a "capture" in the Wayback parody surface.
// The catalog page is itself an incarnation-adjacent surface (it's the
// catalog of all incarnations) and uses the Wayback theme's parlance
// throughout (per the incarnation-terminology memory rule).

const fs = require("node:fs");
const path = require("node:path");

const ARCHIVE_DIR = path.resolve(__dirname, "..", "..", "archive");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function listEntries() {
  const entries = [];
  if (!fs.existsSync(ARCHIVE_DIR)) return entries;

  // Dated weekly incarnations at archive/YYYY-MM-DD/
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

  // Legacy incarnations at archive/_legacy/<slug>/
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
  const sortedAsc = [...entries].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const sortedDesc = [...entries].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const newest = sortedDesc[0];
  const oldest = sortedAsc[0];
  const firstYear = parseInt((oldest && oldest.date || "2021").slice(0, 4), 10);
  const lastYear = parseInt((newest && newest.date || "2026").slice(0, 4), 10);
  const defaultYear = lastYear;

  // Serialized capture list passed into client-side JS for calendar rendering.
  // Trimmed to what the UI needs.
  const capturesPayload = sortedAsc.map((e) => ({
    slug: e.slug,
    url: e.url,
    date: e.date,
    theme: (e.meta && e.meta.theme_name) || e.slug,
    legacy: e.legacy,
    note: (e.meta && e.meta.editorial_note ? e.meta.editorial_note.slice(0, 220) : ""),
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="shortcut icon" href="/favicon.png" />
  <title>Root Ventures Web Archive · captures of https://www.root.vc/</title>
  <meta name="description" content="A calendar of every captured incarnation of root.vc. New captures every Monday." />
  <meta name="robots" content="noindex" />
  <style>
    *, *:before, *:after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      background: #fafafa;
      color: #1a1a1a;
      min-height: 100vh;
    }
    a { color: #1b2c5e; }
    a:hover { color: #2e4f9e; }

    /* Banner */
    .wb-banner {
      background: #1c365e;
      color: #fff;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
    }
    .wb-banner a { color: #ffd24d; text-decoration: none; }
    .wb-banner a:hover { text-decoration: underline; }
    .wb-mark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-size: 13px;
    }
    .wb-mark .glyph {
      display: inline-flex;
      width: 30px; height: 30px;
      border: 2.5px solid #ffd24d;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #ffd24d;
      font-size: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .wb-mark .name { display: flex; flex-direction: column; line-height: 1.1; }
    .wb-mark .name small { font-size: 9px; letter-spacing: 0.14em; opacity: 0.8; font-weight: 600; }
    .wb-url {
      flex: 1 1 320px;
      display: flex;
      gap: 8px;
      align-items: center;
      background: #fff;
      border-radius: 3px;
      padding: 6px 10px;
      color: #1a1a1a;
      box-shadow: 0 1px 0 rgba(0,0,0,.15) inset;
    }
    .wb-url input {
      flex: 1;
      border: 0;
      outline: 0;
      background: transparent;
      font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #1a1a1a;
    }
    .wb-url button {
      border: 0;
      background: #ffd24d;
      color: #1c365e;
      font: 700 11px/1 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 10px;
      border-radius: 2px;
      cursor: pointer;
    }
    .wb-url button:hover { background: #ffe07a; }
    .wb-meta {
      font-size: 11px;
      letter-spacing: 0.04em;
      opacity: 0.85;
      font-variant: small-caps;
    }

    /* Sub-banner with capture count */
    .wb-summary {
      background: #fff;
      border-bottom: 1px solid #d6d6d6;
      padding: 14px 22px;
      display: flex;
      gap: 18px;
      align-items: baseline;
      flex-wrap: wrap;
    }
    .wb-summary strong { color: #1c365e; }
    .wb-summary code {
      font: 12.5px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      color: #1a1a1a;
    }
    .wb-summary .right {
      margin-left: auto;
      font-size: 12px;
      color: #555;
    }
    .wb-summary .right a { color: #1c365e; font-weight: 600; }

    /* Year ribbon */
    .wb-years {
      background: #ebeef3;
      border-bottom: 1px solid #c8cbd1;
      padding: 8px 18px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      align-items: stretch;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
    }
    .wb-year {
      padding: 6px 12px;
      border: 1px solid #c8cbd1;
      border-radius: 3px;
      background: #fff;
      color: #1a1a1a;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      gap: 6px;
      align-items: baseline;
      letter-spacing: 0.04em;
    }
    .wb-year:hover { background: #f5f6f9; border-color: #9aa1ad; }
    .wb-year .count {
      font-size: 10px;
      background: #1c365e;
      color: #fff;
      border-radius: 8px;
      padding: 1px 6px;
      letter-spacing: 0;
    }
    .wb-year.is-active {
      background: #1c365e;
      color: #fff;
      border-color: #1c365e;
    }
    .wb-year.is-active .count { background: #ffd24d; color: #1c365e; }
    .wb-year.is-empty {
      opacity: 0.45;
      cursor: default;
    }

    /* Calendar stage */
    .wb-stage {
      padding: 26px 22px 48px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .wb-stage h2 {
      margin: 0 0 4px;
      font-size: 16px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #555;
      font-weight: 600;
    }
    .wb-stage h2 strong { color: #1c365e; }
    .wb-stage .hint { margin: 0 0 22px; font-size: 12px; color: #777; }
    .wb-months {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 22px;
    }
    .wb-month {
      background: #fff;
      border: 1px solid #d6d6d6;
      border-radius: 4px;
      padding: 12px;
    }
    .wb-month h3 {
      margin: 0 0 8px;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #555;
      font-weight: 700;
      border-bottom: 1px solid #ebebeb;
      padding-bottom: 6px;
    }
    .wb-month table { width: 100%; border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; }
    .wb-month th { text-align: center; font-weight: 600; color: #aaa; padding: 2px 0; }
    .wb-month td { text-align: center; padding: 2px 0; height: 22px; color: #333; }
    .wb-month td.empty { color: #ccc; }
    .wb-month td a.cap {
      display: inline-flex;
      width: 22px; height: 22px;
      align-items: center;
      justify-content: center;
      background: #2e4f9e;
      color: #fff;
      border-radius: 50%;
      text-decoration: none;
      font-weight: 700;
      box-shadow: 0 0 0 2px #cdd6e8;
      transition: transform 0.12s ease;
    }
    .wb-month td a.cap.is-legacy { background: #8a6b1c; box-shadow: 0 0 0 2px #f0e1bc; }
    .wb-month td a.cap.is-current { background: #1c365e; box-shadow: 0 0 0 3px #ffd24d; }
    .wb-month td a.cap:hover { transform: scale(1.18); }

    .wb-empty {
      text-align: center;
      color: #888;
      padding: 60px 0;
      font-style: italic;
      font-size: 14px;
      background: #fff;
      border: 1px dashed #d0d0d0;
      border-radius: 4px;
    }

    /* Capture detail card (shown on hover/tap) */
    .wb-capdetail {
      position: fixed;
      z-index: 90;
      max-width: 320px;
      background: #fff;
      border: 1px solid #1c365e;
      border-radius: 4px;
      padding: 12px 14px;
      box-shadow: 0 8px 28px rgba(0,0,0,.18);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      font-size: 12.5px;
      line-height: 1.45;
    }
    .wb-capdetail.is-visible { opacity: 1; }
    .wb-capdetail strong { color: #1c365e; }
    .wb-capdetail .date {
      font: 11px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #777;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .wb-capdetail .note { color: #444; margin: 6px 0 0; }

    /* Footer disclaimer */
    .wb-foot {
      max-width: 1100px;
      margin: 32px auto;
      padding: 22px;
      border-top: 1px solid #d6d6d6;
      color: #777;
      font-size: 12px;
      line-height: 1.6;
    }
    .wb-foot strong { color: #1c365e; }
    .wb-foot .legend {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      margin: 0 0 10px;
    }
    .wb-foot .legend span {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      font-size: 11px;
      color: #555;
    }
    .wb-foot .swatch {
      display: inline-block;
      width: 12px; height: 12px;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #cdd6e8;
    }
    .wb-foot .swatch.legacy { background: #8a6b1c; box-shadow: 0 0 0 2px #f0e1bc; }
    .wb-foot .swatch.current { background: #1c365e; box-shadow: 0 0 0 3px #ffd24d; }
    .wb-foot .swatch.regular { background: #2e4f9e; }

    @media (max-width: 600px) {
      .wb-banner { padding: 10px 12px; }
      .wb-url { width: 100%; }
      .wb-summary, .wb-years, .wb-stage { padding-left: 12px; padding-right: 12px; }
    }
  </style>
</head>
<body>
  <header class="wb-banner">
    <a class="wb-mark" href="/" title="Root Ventures">
      <span class="glyph">RV</span>
      <span class="name"><strong>Root Ventures</strong><small>Web Archive</small></span>
    </a>
    <form class="wb-url" onsubmit="event.preventDefault();">
      <input type="text" value="https://www.root.vc/" readonly aria-label="URL being browsed in the archive" />
      <button type="submit">Browse history</button>
    </form>
    <div class="wb-meta">Captures by week · curated since 2021</div>
  </header>

  <div class="wb-summary">
    <div>
      Saved <strong>${capturesPayload.length} captures</strong> of <code>https://www.root.vc/</code> between <strong>${escapeHtml((oldest && oldest.date) || "—")}</strong> and <strong>${escapeHtml((newest && newest.date) || "—")}</strong>.
    </div>
    <div class="right">
      Latest: <a href="${escapeHtml((newest && newest.url) || "/")}">${escapeHtml((newest && newest.meta && newest.meta.theme_name) || "—")}</a>
    </div>
  </div>

  <nav class="wb-years" id="yearRibbon" aria-label="Capture year">
    <!-- Year tabs populated by inline JS -->
  </nav>

  <main class="wb-stage">
    <h2 id="yearTitle"></h2>
    <p class="hint">Each colored circle is a capture. Click to open that incarnation as it shipped.</p>
    <div class="wb-months" id="monthsGrid"></div>
  </main>

  <div class="wb-capdetail" id="capDetail" role="tooltip"></div>

  <section class="wb-foot">
    <div class="legend">
      <span><span class="swatch regular"></span> dated incarnation</span>
      <span><span class="swatch legacy"></span> legacy (pre-cycle)</span>
      <span><span class="swatch current"></span> live now</span>
    </div>
    <p>Made by <strong>Root Ventures</strong>. An obvious parody of the <em>Internet Archive's Wayback Machine</em>. Please don't sue us, archive.org — we love you, and we run with your spirit: nothing on the web should disappear forever.</p>
    <p>This catalog is generated by <code>scripts/cycle/rebuild-archive-index.js</code> from <code>archive/chain.json</code>. The chain is rebuilt after every Monday's incarnation ships.</p>
  </section>

  <script>
    (function () {
      const CAPTURES = ${JSON.stringify(capturesPayload, null, 2)};
      const FIRST_YEAR = ${firstYear};
      const LAST_YEAR = ${lastYear};
      const DEFAULT_YEAR = ${defaultYear};
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const DOW = ["S","M","T","W","T","F","S"];

      const ribbon = document.getElementById("yearRibbon");
      const grid = document.getElementById("monthsGrid");
      const title = document.getElementById("yearTitle");
      const detail = document.getElementById("capDetail");

      function pad(n) { return n < 10 ? "0" + n : "" + n; }

      function indexByYear() {
        const m = {};
        CAPTURES.forEach((c) => {
          const y = c.date.slice(0,4);
          if (!m[y]) m[y] = [];
          m[y].push(c);
        });
        return m;
      }
      const byYear = indexByYear();
      const liveSlug = (CAPTURES[CAPTURES.length - 1] || {}).slug;

      function readYearFromHash() {
        const m = (location.hash || "").match(/#y=(\\d{4})/);
        if (m) {
          const y = parseInt(m[1], 10);
          if (y >= FIRST_YEAR && y <= LAST_YEAR) return y;
        }
        return DEFAULT_YEAR;
      }

      function renderRibbon(activeYear) {
        ribbon.innerHTML = "";
        for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
          const count = (byYear[String(y)] || []).length;
          const el = document.createElement("a");
          el.href = "#y=" + y;
          el.className = "wb-year" + (y === activeYear ? " is-active" : "") + (count === 0 ? " is-empty" : "");
          el.innerHTML = "<span>" + y + "</span><span class='count'>" + count + "</span>";
          el.addEventListener("click", function (ev) {
            ev.preventDefault();
            location.hash = "#y=" + y;
            render(y);
          });
          ribbon.appendChild(el);
        }
      }

      function buildMonth(year, monthIdx) {
        const first = new Date(year, monthIdx, 1);
        const startDow = first.getDay();
        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        const dayCaptures = {};
        (byYear[String(year)] || []).forEach((c) => {
          const m = parseInt(c.date.slice(5,7), 10) - 1;
          if (m !== monthIdx) return;
          const d = parseInt(c.date.slice(8,10), 10);
          if (!dayCaptures[d]) dayCaptures[d] = [];
          dayCaptures[d].push(c);
        });
        const rows = [];
        let week = new Array(7).fill(null);
        let cursor = 0;
        for (let i = 0; i < startDow; i++) { week[i] = null; cursor++; }
        for (let d = 1; d <= daysInMonth; d++) {
          if (cursor === 7) { rows.push(week); week = new Array(7).fill(null); cursor = 0; }
          week[cursor] = d;
          cursor++;
        }
        for (let i = cursor; i < 7; i++) week[i] = null;
        rows.push(week);

        let html = '<div class="wb-month"><h3>' + MONTHS[monthIdx] + " " + year + '</h3><table><thead><tr>';
        DOW.forEach((d) => { html += "<th>" + d + "</th>"; });
        html += "</tr></thead><tbody>";
        rows.forEach((row) => {
          html += "<tr>";
          row.forEach((d) => {
            if (d == null) { html += '<td class="empty"></td>'; return; }
            const caps = dayCaptures[d];
            if (caps && caps.length) {
              const c = caps[0];
              const klass = "cap" + (c.legacy ? " is-legacy" : "") + (c.slug === liveSlug ? " is-current" : "");
              html += '<td><a class="' + klass + '" href="' + c.url + '"'
                   + ' data-theme="' + c.theme.replace(/"/g, '&quot;') + '"'
                   + ' data-date="' + c.date + '"'
                   + ' data-note="' + (c.note || "").replace(/"/g, '&quot;') + '"'
                   + ' data-current="' + (c.slug === liveSlug ? "true" : "false") + '"'
                   + '>' + d + '</a></td>';
            } else {
              html += '<td>' + d + '</td>';
            }
          });
          html += "</tr>";
        });
        html += "</tbody></table></div>";
        return html;
      }

      function render(year) {
        title.innerHTML = "<strong>" + year + "</strong> · " + ((byYear[String(year)] || []).length) + " captures";
        renderRibbon(year);
        let html = "";
        for (let m = 0; m < 12; m++) html += buildMonth(year, m);
        grid.innerHTML = html;
        if ((byYear[String(year)] || []).length === 0) {
          grid.innerHTML = '<div class="wb-empty">No captures recorded in ' + year + '. The cycle had not yet started, or no new incarnation shipped this year. Pick another year above.</div>';
        }
        wireCaptureHover();
      }

      function wireCaptureHover() {
        const caps = grid.querySelectorAll("a.cap");
        caps.forEach((a) => {
          a.addEventListener("mouseenter", function (ev) {
            const isCurrent = ev.target.getAttribute("data-current") === "true";
            detail.innerHTML =
              '<div class="date">' + ev.target.getAttribute("data-date")
              + (isCurrent ? " · LIVE NOW" : "") + '</div>'
              + '<strong>' + ev.target.getAttribute("data-theme") + '</strong>'
              + '<p class="note">' + (ev.target.getAttribute("data-note") || "") + '</p>';
            const r = ev.target.getBoundingClientRect();
            detail.style.left = Math.min(window.innerWidth - 340, r.left + r.width + 8) + "px";
            detail.style.top = Math.max(8, r.top - 8) + "px";
            detail.classList.add("is-visible");
          });
          a.addEventListener("mouseleave", function () {
            detail.classList.remove("is-visible");
          });
        });
      }

      window.addEventListener("hashchange", function () { render(readYearFromHash()); });
      render(readYearFromHash());
    })();
  </script>
</body>
</html>
`;
}

function buildChainJson(entries) {
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

  console.log(`Wrote ${indexPath} (${entries.length} captures)`);
  console.log(`Wrote ${chainPath}`);
}

if (require.main === module) main();
module.exports = { listEntries, buildIndexHtml, buildChainJson };
