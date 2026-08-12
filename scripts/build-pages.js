// build-pages.js — Makes the terminal legible to crawlers, without a website.
//
// root.vc is an xterm.js terminal: everything it knows lives in config/*.js and
// is only written to the DOM when a visitor types a command. Search engines and
// LLM crawlers therefore see almost nothing. This script closes that gap from a
// single URL rather than by shipping a parallel website.
//
// There used to be a static mirror here — real HTML pages at /portfolio/,
// /team/, /about/ and /jobs/. It worked, and that was the problem: Google
// indexed all 70-odd of them and started showing sitelinks to About / Team /
// Jobs under the root.vc result, which advertises a conventional site sitting
// behind the terminal. The terminal is the product, so the mirror is gone.
//
// What replaces it:
//
//   index.html      an offscreen block naming every company and person, so a
//                   crawler that never runs JS still reads the whole map
//   _redirects      every old mirror URL 301s into the terminal at the command
//                   that shows the same thing
//   llms.txt        the same content as prose, for LLM crawlers
//   sitemap.xml     one URL, because there is now genuinely one page
//
// Content is addressed by URL fragment: /#tldr-chargelab tells the terminal to
// run `tldr chargelab` on load. Fragments never reach the server and Google
// strips them before indexing, so this deliberately trades per-company search
// results for having exactly one indexed URL.
//
// config/*.js is the ONLY source of truth. Nothing here is hand-maintained:
// editing a description regenerates the homepage block, the llms files, and the
// redirects.
//
// Everything is written into dist/, which is the Netlify publish directory and
// is gitignored. Generated files are never committed, so there is nothing that
// can fall out of sync with config/*.js and nothing to check for drift.

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "dist");

const ORIGIN = "https://root.vc";

// Sentinel comment pairs in index.html; everything between each pair is
// regenerated from config/*.js on every build.
const INDEX_BEGIN = "<!-- BEGIN generated-index -->";
const INDEX_END = "<!-- END generated-index -->";
const JSONLD_BEGIN = "<!-- BEGIN generated-jsonld -->";
const JSONLD_END = "<!-- END generated-jsonld -->";

// ── Loading config/*.js ───────────────────────────────────────────────────────

// Reads a source file from the repo. Sources are inputs to the build; they are
// never written back to.
function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

// Writes a generated file into dist/. Everything this script emits goes here.
function writeText(relativePath, content) {
  const absolutePath = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

// The pure-data config files carry a guarded `module.exports` footer so they
// work unchanged as classic browser scripts and as CommonJS modules here. See
// the note at the bottom of config/firm.js.
//
// Only pure-data files are loaded. config/commands.js and config/fs.js touch
// `term` and `document`, and loading them here would let a future terminal-only
// change break `npm run build`.
function loadConfig() {
  return {
    firm: require("../config/firm.js").firm,
    portfolio: require("../config/portfolio.js").portfolio,
    team: require("../config/team.js").team,
    jobs: require("../config/jobs.js").jobs,
  };
}

// ── Escaping ──────────────────────────────────────────────────────────────────

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// JSON-LD sits inside a <script>, where the HTML parser still hunts for
// "</script". Escaping the three characters that can start a breakout keeps the
// payload valid JSON while making it inert to the parser.
function jsonLdScript(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function absUrl(pathname) {
  return `${ORIGIN}${pathname}`;
}

// Portfolio entries can carry "(inactive)" instead of a real URL (see
// js/geo.js). Also rejects anything that isn't a plain http(s) URL — e.g. a
// stray "javascript:" or "data:" scheme in config data — so it can never reach
// an href. Anyone who can edit config/*.js can already edit the terminal's own
// code, so this isn't defending against an attacker; it's a cheap guard
// against a typo or a copy-pasted link producing broken or unsafe markup.
function hasLink(url) {
  if (!url || url === "(inactive)") return false;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

// ── Deep links ────────────────────────────────────────────────────────────────

// js/terminal-ext.js reads the URL fragment as a command to run on load,
// splitting the command from its argument on the FIRST hyphen. Every link,
// redirect and llms.txt entry below is built from this one function so the two
// halves cannot drift — if the separator ever changes, it changes here.
function deepLink(command) {
  return `/#${command.replace(/\s+/g, "-")}`;
}

// The terminal command that displays each thing the old mirror had a page for.
const COMMANDS = {
  about: "whois root",
  jobs: "jobs",
  portfolioIndex: "tldr",
  teamIndex: "whois",
  company: (slug) => `tldr ${slug}`,
  person: (slug) => `whois ${slug}`,
};

// ── Shared schema.org nodes ───────────────────────────────────────────────────

const ORG_ID = `${ORIGIN}/#organization`;

function organizationNode(firm, team) {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: firm.name,
    alternateName: "Root",
    url: `${ORIGIN}/`,
    description: firm.blurb,
    slogan: firm.tagline,
    email: firm.email,
    logo: { "@type": "ImageObject", url: `${ORIGIN}/images/logo.png` },
    address: { "@type": "PostalAddress", ...firm.address },
    sameAs: firm.social,
    knowsAbout: firm.focusAreas,
    employee: Object.keys(team).map((slug) => ({
      "@id": `${ORIGIN}/#person-${slug}`,
    })),
  };
}

// People and companies used to be the mainEntity of their own page. With one
// page left they become nodes in the homepage graph, keyed by fragment @ids so
// each is still individually addressable to a parser.
function personNode(slug, person) {
  return {
    "@type": "Person",
    "@id": `${ORIGIN}/#person-${slug}`,
    name: person.name,
    jobTitle: person.title,
    description: person.description,
    url: absUrl(deepLink(COMMANDS.person(slug))),
    image: `${ORIGIN}/images/${slug}.png`,
    email: `${slug}@root.vc`,
    worksFor: { "@id": ORG_ID },
    sameAs: hasLink(person.linkedin) ? [person.linkedin] : undefined,
  };
}

function companyNode(slug, company) {
  const node = {
    "@type": "Organization",
    "@id": `${ORIGIN}/#company-${slug}`,
    name: company.name,
    description: company.description,
    image: `${ORIGIN}/images/${slug}.jpg`,
    funder: { "@id": ORG_ID },
  };
  // The company's own site is the better `url`; the deep link is where root.vc
  // talks about them, which is what subjectOf means.
  if (hasLink(company.url)) node.url = company.url;
  node.subjectOf = absUrl(deepLink(COMMANDS.company(slug)));
  return node;
}

// ── robots.txt / sitemap.xml / llms.txt ───────────────────────────────────────

// Crawlers that power LLM answers and training corpora. Listed explicitly so
// the intent is unambiguous rather than relying on "absent means allowed".
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "Bytespider",
  "meta-externalagent",
  "cohere-ai",
  "MistralAI-User",
  "Diffbot",
  "Timpibot",
  "YouBot",
];

function renderRobots() {
  // Nothing that carries content is disallowed — never /js/, /css/, or
  // /config/, since crawlers have to fetch all three to render the terminal and
  // welcome.htm, both of which build their content from config/*.js at runtime.
  const blocks = [
    "# root.vc — https://root.vc",
    "# AI crawlers are welcome here. The whole site is one page: the terminal",
    "# at / carries every company and person as text, and /llms.txt repeats it",
    "# as prose.",
    "",
    "User-agent: *",
    "Allow: /",
    "Disallow: /scripts/",
    "Disallow: /tests/",
    "Disallow: /netlify/",
    "",
  ];

  for (const agent of AI_CRAWLERS) {
    blocks.push(`User-agent: ${agent}`, "Allow: /", "");
  }

  blocks.push(`Sitemap: ${ORIGIN}/sitemap.xml`, "");
  return blocks.join("\n");
}

function renderSitemap(urls) {
  const entries = urls
    .map((url) => `  <url>\n    <loc>${esc(url)}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

// ── Redirects ─────────────────────────────────────────────────────────────────

// Every URL the old static mirror occupied now redirects into the terminal at
// the command that shows the same content.
//
// 301 rather than letting them 404. Google drops a redirected URL and folds its
// signals into the destination, where a 404 just decays, and anyone following an
// old link from elsewhere still lands on the right thing instead of an error.
//
// Netlify matches these top to bottom and takes the first hit, so the exact
// paths have to precede the :slug patterns that would otherwise swallow them.
// Both the bare and trailing-slash forms are listed rather than relying on
// Netlify's normalization.
function renderRedirects() {
  const exact = [
    ["/about", COMMANDS.about],
    ["/jobs", COMMANDS.jobs],
    ["/portfolio", COMMANDS.portfolioIndex],
    ["/team", COMMANDS.teamIndex],
  ];

  const lines = [
    "# Generated by scripts/build-pages.js — do not edit.",
    "# The static mirror's URLs, pointed at the terminal commands that replaced",
    "# them. See the header of build-pages.js for why the mirror is gone.",
    "",
  ];

  for (const [pathname, command] of exact) {
    lines.push(`${pathname}/    ${deepLink(command)}    301`);
    lines.push(`${pathname}    ${deepLink(command)}    301`);
  }

  lines.push("");
  // :slug is a Netlify placeholder, echoed into the destination. One rule per
  // shape covers every company and person without enumerating them.
  lines.push("/portfolio/:slug/    /#tldr-:slug    301");
  lines.push("/portfolio/:slug    /#tldr-:slug    301");
  lines.push("/team/:slug/    /#whois-:slug    301");
  lines.push("/team/:slug    /#whois-:slug    301");
  lines.push("");

  return lines.join("\n");
}

// ── llms.txt ──────────────────────────────────────────────────────────────────

function renderLlmsTxt({ firm, portfolio, team, jobs }) {
  const lines = [
    `# ${firm.name}`,
    "",
    `> ${firm.blurb}`,
    "",
    `${firm.name} is a seed-stage venture capital firm in ${firm.address.addressLocality}, ${firm.address.addressRegion}. Mission: ${firm.tagline}. Thesis: ${firm.thesis} Fund size ${firm.fundSize}, typical check ${firm.checkSize}. Focus areas: ${firm.focusAreas.join(", ")}.`,
    "",
    `The website at ${ORIGIN} is an interactive terminal and is the only page. Each link below opens it with the matching command already run; the content is also inline in this file and in /llms-full.txt.`,
    "",
    "## About",
    "",
    `- [About ${firm.name}](${absUrl(deepLink(COMMANDS.about))}): fund details, thesis, office, and contact.`,
    `- [Jobs](${absUrl(deepLink(COMMANDS.jobs))}): ${
      Object.keys(jobs).length
        ? `open roles — ${Object.keys(jobs)
            .map((id) => jobs[id][0])
            .join(", ")}.`
        : "open roles."
    }`,
    "",
    "## Team",
    "",
  ];

  for (const slug of Object.keys(team)) {
    lines.push(
      `- [${team[slug].name}](${absUrl(deepLink(COMMANDS.person(slug)))}): ${team[slug].title}. ${team[slug].description}`
    );
  }

  lines.push("", "## Portfolio", "");
  for (const slug of Object.keys(portfolio)) {
    lines.push(
      `- [${portfolio[slug].name}](${absUrl(deepLink(COMMANDS.company(slug)))}): ${portfolio[slug].description}`
    );
  }

  lines.push("");

  return lines.join("\n");
}

function renderLlmsFull({ firm, portfolio, team, jobs }) {
  const { streetAddress, addressLocality, addressRegion, postalCode } = firm.address;
  const lines = [
    `# ${firm.name}`,
    "",
    firm.blurb,
    "",
    `Mission: ${firm.tagline}`,
    `Thesis: ${firm.thesis}`,
    `Fund size: ${firm.fundSize}`,
    `Typical check size: ${firm.checkSize}`,
    `Stage: Seed, usually leading the initial round`,
    `Focus areas: ${firm.focusAreas.join(", ")}`,
    `Office: ${streetAddress}, ${addressLocality}, ${addressRegion} ${postalCode}`,
    `Email: ${firm.email}`,
    `Website: ${ORIGIN}/`,
    `Also at: ${firm.social.join(", ")}`,
    "",
    "## Team",
    "",
  ];

  for (const slug of Object.keys(team)) {
    const person = team[slug];
    lines.push(`### ${person.name} — ${person.title}`, "", person.description, "");
    lines.push(`Email: ${slug}@root.vc`);
    if (hasLink(person.linkedin)) lines.push(`LinkedIn: ${person.linkedin}`);
    lines.push(`Terminal: ${absUrl(deepLink(COMMANDS.person(slug)))}`, "");
  }

  lines.push(`## Portfolio (${Object.keys(portfolio).length} companies)`, "");
  for (const slug of Object.keys(portfolio)) {
    const company = portfolio[slug];
    lines.push(`### ${company.name}`, "", company.description, "");
    if (hasLink(company.url)) lines.push(`Website: ${company.url}`);
    if (hasLink(company.demo)) lines.push(`Demo: ${company.demo}`);
    if (hasLink(company.memo)) lines.push(`Investment memo: ${company.memo}`);
    lines.push(`Terminal: ${absUrl(deepLink(COMMANDS.company(slug)))}`, "");
  }

  lines.push("## Open roles", "");
  for (const id of Object.keys(jobs)) {
    const [title, ...rest] = jobs[id];
    lines.push(
      `### ${title}`,
      "",
      ...rest.map((line) => line.trim()),
      "",
      `Apply: ${firm.email}`,
      ""
    );
  }

  return lines.join("\n");
}

// ── index.html crawlable index injection ─────────────────────────────────────

// Most LLM crawlers do not execute JavaScript, so on the homepage they see an
// empty <div id="terminal">. This block gives them the whole map, and with the
// mirror gone it is the only place that content exists as HTML.
//
// It is a visually-hidden div rather than <noscript>. Extraction pipelines
// routinely strip <noscript> as non-content, which would leave the homepage
// looking empty to exactly the crawlers this exists for. And Googlebot indexes
// the rendered DOM, which omits <noscript> entirely once JS runs. A clipped div
// is present in both the raw HTML and the rendered DOM, and unlike display:none
// it is not discounted. Sighted visitors never see it, so the terminal is
// visually untouched.
function renderTextIndex({ firm, portfolio, team }) {
  const companies = Object.keys(portfolio)
    .map(
      (slug) =>
        `          <li><a href="${deepLink(COMMANDS.company(slug))}">${esc(portfolio[slug].name)}</a> — ${esc(portfolio[slug].description)}</li>`
    )
    .join("\n");
  const people = Object.keys(team)
    .map(
      (slug) =>
        `          <li><a href="${deepLink(COMMANDS.person(slug))}">${esc(team[slug].name)}</a> — ${esc(team[slug].title)}</li>`
    )
    .join("\n");

  return `${INDEX_BEGIN}
      <div id="text-version" class="visually-hidden">
        <p>${esc(firm.blurb)}</p>
        <p>
          <a href="${deepLink(COMMANDS.about)}">About</a> ·
          <a href="${deepLink(COMMANDS.portfolioIndex)}">Portfolio</a> ·
          <a href="${deepLink(COMMANDS.teamIndex)}">Team</a> ·
          <a href="${deepLink(COMMANDS.jobs)}">Jobs</a>
        </p>
        <h2>Portfolio</h2>
        <ul>
${companies}
        </ul>
        <h2>Team</h2>
        <ul>
${people}
        </ul>
      </div>
      ${INDEX_END}`;
}

// One page means one graph. Every person and company that used to be the
// mainEntity of its own page is a node here instead.
function renderHomeJsonLd({ firm, portfolio, team }) {
  return `${JSONLD_BEGIN}
      ${jsonLdScript({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${ORIGIN}/#website`,
            url: `${ORIGIN}/`,
            name: firm.name,
            description: firm.blurb,
            publisher: { "@id": ORG_ID },
          },
          organizationNode(firm, team),
          ...Object.keys(team).map((slug) => personNode(slug, team[slug])),
          ...Object.keys(portfolio).map((slug) =>
            companyNode(slug, portfolio[slug])
          ),
        ],
      })}
      ${JSONLD_END}`;
}

function injectBetween(html, beginMarker, endMarker, block) {
  const start = html.indexOf(beginMarker);
  const end = html.indexOf(endMarker);

  if (start === -1 || end === -1) {
    throw new Error(
      `index.html is missing the ${beginMarker} / ${endMarker} sentinel comments; ` +
        "build-pages.js needs them to know where to write generated content."
    );
  }

  return html.slice(0, start) + block + html.slice(end + endMarker.length);
}

function renderIndexHtml(config) {
  let html = readText("index.html");
  html = injectBetween(html, JSONLD_BEGIN, JSONLD_END, renderHomeJsonLd(config));
  html = injectBetween(html, INDEX_BEGIN, INDEX_END, renderTextIndex(config));
  return html;
}

// ── Orchestration ─────────────────────────────────────────────────────────────

function buildPages(config = loadConfig()) {
  return [
    // One URL, so one entry. No <lastmod>: every deploy rebuilds every file, so
    // a build timestamp would claim a change on each deploy and teach crawlers
    // to ignore it.
    { path: "sitemap.xml", content: renderSitemap([`${ORIGIN}/`]) },
    { path: "robots.txt", content: renderRobots() },
    { path: "_redirects", content: renderRedirects() },
    { path: "llms.txt", content: renderLlmsTxt(config) },
    { path: "llms-full.txt", content: renderLlmsFull(config) },
    { path: "index.html", content: renderIndexHtml(config) },
  ];
}

function writePages() {
  const files = buildPages();
  for (const file of files) {
    writeText(file.path, file.content);
  }
  console.log(`crawlable surface: ${files.length} files`);
  return files;
}

module.exports = {
  AI_CRAWLERS,
  COMMANDS,
  ORIGIN,
  buildPages,
  deepLink,
  esc,
  injectBetween,
  loadConfig,
  outDir,
  renderIndexHtml,
  renderRedirects,
  renderTextIndex,
  writePages,
};

if (require.main === module) {
  writePages();
}
