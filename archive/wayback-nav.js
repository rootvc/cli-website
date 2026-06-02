// archive/wayback-nav.js — Wayback-Machine-styled strip injected at the top of
// every dated incarnation page. Replaces the old per-theme prev/next nav.
//
// Behavior:
//   1. If the page was reached via browser refresh, redirect to /rand/ so the
//      visitor lands on a fresh random capture every reload. (Per product spec:
//      "typing rand OR hitting refresh sends you to a random AI-generated page.")
//   2. Otherwise, fetch /archive/chain.json and render a sticky banner above
//      the page content showing every capture in the archive, with the current
//      one highlighted. Click any date to jump.
//   3. Styles are isolated in a closed Shadow DOM so the strip never collides
//      with the theme's CSS.
//
// CSP: the file is served same-origin, so `script-src 'self'` covers it.
// Each archive page only needs:
//     <script src="/archive/wayback-nav.js" defer></script>
// in <head>. The script handles its own DOM injection.

(function () {
  "use strict";

  // ── Refresh → /rand/ ─────────────────────────────────────────────────────
  // Only intercept reloads of dated archive pages. Direct navigation (typing
  // a URL, clicking a link, the wayback strip itself, the back button) all
  // leave the page alone. /rand/ is the only entry point that randomizes.
  try {
    var entries = performance.getEntriesByType
      ? performance.getEntriesByType("navigation")
      : null;
    var navType = entries && entries[0] && entries[0].type;
    var isReload = navType === "reload" || performance.navigation && performance.navigation.type === 1;
    if (isReload && /^\/archive\/(\d{4}-\d{2}-\d{2}|_legacy\/)/.test(location.pathname)) {
      location.replace("/rand/");
      return;
    }
  } catch (_) {
    // Navigation API unavailable; skip the refresh-randomizer rather than fail.
  }

  // ── Render the strip ─────────────────────────────────────────────────────
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    fetch("/archive/chain.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(render)
      .catch(function () { /* silent — strip just won't appear */ });
  });

  function render(chain) {
    var here = location.pathname.replace(/\/+$/, "/");
    var sorted = chain.slice().sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    var idx = sorted.findIndex(function (e) {
      return e.url.replace(/\/+$/, "/") === here;
    });
    var current = idx >= 0 ? sorted[idx] : null;
    var prevEntry = idx > 0 ? sorted[idx - 1] : null;
    var nextEntry = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

    var host = document.createElement("div");
    host.id = "rv-wayback-host";
    // Ensure the strip sits above anything sticky/fixed the theme might create.
    host.style.cssText = [
      "all: initial",
      "display: block",
      "position: sticky",
      "top: 0",
      "z-index: 2147483646",
      "width: 100%",
    ].join(";");
    document.body.insertBefore(host, document.body.firstChild);

    var shadow = host.attachShadow ? host.attachShadow({ mode: "closed" }) : host;

    // Build all DOM nodes — no innerHTML, no unsafe-inline. Closed shadow keeps
    // the theme's CSS out and our CSS in.
    var style = document.createElement("style");
    style.textContent = css();
    shadow.appendChild(style);

    var bar = document.createElement("div");
    bar.className = "wb";
    shadow.appendChild(bar);

    // Top row: mark + URL bar + meta
    var row = document.createElement("div");
    row.className = "wb__row";
    bar.appendChild(row);

    var mark = document.createElement("a");
    mark.className = "wb__mark";
    mark.href = "/archive/";
    mark.setAttribute("aria-label", "Root Ventures Web Archive home");
    var glyph = document.createElement("span");
    glyph.className = "wb__glyph";
    glyph.textContent = "R";
    var markName = document.createElement("span");
    markName.className = "wb__mark-name";
    var markTop = document.createElement("strong");
    markTop.textContent = "ROOT VENTURES";
    var markSub = document.createElement("small");
    markSub.textContent = "Web Archive";
    markName.appendChild(markTop);
    markName.appendChild(markSub);
    mark.appendChild(glyph);
    mark.appendChild(markName);
    row.appendChild(mark);

    var url = document.createElement("div");
    url.className = "wb__url";
    var urlText = document.createElement("span");
    urlText.className = "wb__url-text";
    urlText.textContent = "https://www.root.vc/";
    var randBtn = document.createElement("a");
    randBtn.className = "wb__rand";
    randBtn.href = "/rand/";
    randBtn.title = "Spin to a random capture";
    randBtn.textContent = "RANDOM";
    url.appendChild(urlText);
    url.appendChild(randBtn);
    row.appendChild(url);

    var meta = document.createElement("div");
    meta.className = "wb__meta";
    var captured = document.createElement("div");
    captured.className = "wb__meta-line";
    captured.textContent = current
      ? "Captured " + formatDate(current.date)
      : "Live archive index";
    var sub = document.createElement("div");
    sub.className = "wb__meta-sub";
    sub.textContent = current
      ? (current.theme_name || "—")
      : sorted.length + " captures total";
    meta.appendChild(captured);
    meta.appendChild(sub);
    row.appendChild(meta);

    // Timeline row: every capture as a dot/date, in chronological order
    var timeline = document.createElement("nav");
    timeline.className = "wb__timeline";
    timeline.setAttribute("aria-label", "All captures of root.vc");

    var prevCell = document.createElement("a");
    prevCell.className = "wb__arrow" + (prevEntry ? "" : " wb__arrow--off");
    prevCell.textContent = "‹";
    if (prevEntry) {
      prevCell.href = prevEntry.url;
      prevCell.title = "Previous capture · " + prevEntry.date + " · " + (prevEntry.theme_name || "");
    } else {
      prevCell.setAttribute("aria-disabled", "true");
    }
    timeline.appendChild(prevCell);

    var track = document.createElement("div");
    track.className = "wb__track";
    sorted.forEach(function (entry) {
      var cell = document.createElement("a");
      cell.className = "wb__cell";
      if (entry.legacy) cell.classList.add("wb__cell--legacy");
      if (current && entry.url === current.url) cell.classList.add("wb__cell--current");
      cell.href = entry.url;
      cell.title = entry.date + " · " + (entry.theme_name || "");
      var dot = document.createElement("span");
      dot.className = "wb__dot";
      var label = document.createElement("span");
      label.className = "wb__cell-label";
      label.textContent = entry.date;
      cell.appendChild(dot);
      cell.appendChild(label);
      track.appendChild(cell);
    });
    timeline.appendChild(track);

    var nextCell = document.createElement("a");
    nextCell.className = "wb__arrow" + (nextEntry ? "" : " wb__arrow--off");
    nextCell.textContent = "›";
    if (nextEntry) {
      nextCell.href = nextEntry.url;
      nextCell.title = "Next capture · " + nextEntry.date + " · " + (nextEntry.theme_name || "");
    } else {
      nextCell.setAttribute("aria-disabled", "true");
    }
    timeline.appendChild(nextCell);

    bar.appendChild(timeline);

    // After insertion, scroll the current cell into view so visitors land on
    // it even when the archive grows long.
    if (current) {
      var cur = track.querySelector(".wb__cell--current");
      if (cur && cur.scrollIntoView) {
        try {
          cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
        } catch (_) {
          cur.scrollIntoView(false);
        }
      }
    }
  }

  function formatDate(iso) {
    // Accept YYYY-MM-DD and render as "02 JUN 2026" for that "scanned this day"
    // Wayback feel. Falls back to the raw string if parsing fails.
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return iso || "";
    var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return m[3] + " " + months[parseInt(m[2], 10) - 1] + " " + m[1];
  }

  function css() {
    return [
      ":host, .wb, .wb * { box-sizing: border-box; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }",
      ".wb { display: block; width: 100%; background: #1c365e; color: #fff; border-bottom: 3px solid #ffd24d; font-size: 12px; line-height: 1.3; }",
      ".wb__row { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; padding: 8px 14px; }",
      ".wb__mark { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #ffd24d; }",
      ".wb__mark:hover .wb__mark-name strong { text-decoration: underline; }",
      ".wb__glyph { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 2px solid #ffd24d; border-radius: 50%; font-weight: 700; }",
      ".wb__mark-name { display: flex; flex-direction: column; line-height: 1.05; }",
      ".wb__mark-name strong { font-size: 11px; letter-spacing: 0.06em; }",
      ".wb__mark-name small { font-size: 9px; letter-spacing: 0.14em; opacity: 0.85; }",
      ".wb__url { display: flex; align-items: center; gap: 8px; background: #fff; color: #1a1a1a; border-radius: 3px; padding: 5px 8px; min-width: 0; }",
      ".wb__url-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }",
      ".wb__rand { background: #ffd24d; color: #1c365e; text-decoration: none; font-weight: 700; font-size: 10px; letter-spacing: 0.1em; padding: 4px 8px; border-radius: 2px; }",
      ".wb__rand:hover { background: #ffe07a; }",
      ".wb__meta { text-align: right; font-size: 10px; }",
      ".wb__meta-line { font-weight: 700; letter-spacing: 0.06em; color: #ffd24d; }",
      ".wb__meta-sub { opacity: 0.85; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; max-width: 220px; }",
      ".wb__timeline { display: flex; align-items: stretch; background: rgba(0,0,0,0.18); border-top: 1px dashed rgba(255,210,77,0.35); }",
      ".wb__arrow { width: 28px; display: inline-flex; align-items: center; justify-content: center; color: #ffd24d; text-decoration: none; font-size: 18px; line-height: 1; }",
      ".wb__arrow:hover { background: rgba(255,210,77,0.18); }",
      ".wb__arrow--off { color: rgba(255,210,77,0.25); pointer-events: none; }",
      ".wb__track { flex: 1; display: flex; gap: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: rgba(255,210,77,0.5) transparent; }",
      ".wb__track::-webkit-scrollbar { height: 5px; }",
      ".wb__track::-webkit-scrollbar-thumb { background: rgba(255,210,77,0.45); }",
      ".wb__cell { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 5px 10px; text-decoration: none; color: rgba(255,255,255,0.78); border-left: 1px solid rgba(255,255,255,0.08); min-width: 84px; }",
      ".wb__cell:first-child { border-left: none; }",
      ".wb__cell:hover { background: rgba(255,210,77,0.12); color: #fff; }",
      ".wb__cell--legacy { color: rgba(255,255,255,0.55); font-style: italic; }",
      ".wb__cell--current { background: #ffd24d; color: #1c365e; font-weight: 700; }",
      ".wb__cell--current:hover { background: #ffd24d; color: #1c365e; }",
      ".wb__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.8; }",
      ".wb__cell--current .wb__dot { background: #1c365e; opacity: 1; }",
      ".wb__cell-label { font-size: 10px; letter-spacing: 0.04em; }",
      "@media (max-width: 640px) { .wb__row { grid-template-columns: auto 1fr; row-gap: 6px; padding: 6px 10px; } .wb__meta { grid-column: 1 / -1; text-align: left; } .wb__cell { min-width: 72px; padding: 4px 8px; } }",
      "@media print { :host { display: none !important; } }",
    ].join("\n");
  }
})();
