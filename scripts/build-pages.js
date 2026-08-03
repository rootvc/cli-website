// build-pages.js — Generates the static, crawlable mirror of the terminal.
//
// root.vc is an xterm.js terminal: everything it knows lives in config/*.js and
// is only written to the DOM when a visitor types a command. Search engines and
// LLM crawlers therefore see almost nothing. This script renders that same data
// as plain HTML at real URLs so they can read it.
//
//   /portfolio/  /portfolio/<slug>/   /team/  /team/<slug>/  /about/  /jobs/
//   robots.txt   sitemap.xml   llms.txt   llms-full.txt
//
// config/*.js is the ONLY source of truth. Nothing here is hand-maintained:
// editing a description regenerates its page, both indexes, the sitemap, the
// llms files, and the <noscript> block in index.html. This runs as part of
// `npm run build`, so a Netlify deploy always publishes current data.
//
// Run `node scripts/build-pages.js --check` to verify the committed output
// matches what the current config would produce (used by CI).

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");

const ORIGIN = "https://root.vc";
const OG_IMAGE = `${ORIGIN}/images/og-image.png`;

// Sentinel comment pairs in index.html; everything between each pair is
// regenerated from config/*.js on every build.
const NOSCRIPT_BEGIN = "<!-- BEGIN generated-index -->";
const NOSCRIPT_END = "<!-- END generated-index -->";
const JSONLD_BEGIN = "<!-- BEGIN generated-jsonld -->";
const JSONLD_END = "<!-- END generated-jsonld -->";

// ── Loading config/*.js ───────────────────────────────────────────────────────

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function writeText(relativePath, content) {
  const absolutePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

// The config files are classic browser scripts declaring bare globals — they
// have no exports, and adding some would break both the terser bundle in
// build-assets.js and the raw <script> tags in welcome.htm. So evaluate them
// the same way a browser would, in a vm context.
//
// Gotcha: a top-level `const` does NOT become a property of the context object
// (ctx.portfolio is undefined). It lands in the context's global lexical
// environment, which persists across runInContext calls — hence the trailing
// expression script to pull the values out.
//
// Only pure-data files are loaded. config/commands.js and config/fs.js touch
// `term` and `document`, and loading them here would let a future terminal-only
// change break `npm run build`.
function loadConfig() {
  const context = vm.createContext({});
  const sources = [
    "config/firm.js",
    "config/portfolio.js",
    "config/team.js",
    "config/jobs.js",
  ];

  for (const file of sources) {
    vm.runInContext(readText(file), context, { filename: file });
  }

  return vm.runInContext("({ firm, portfolio, team, jobs })", context);
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

// Meta descriptions get truncated by search engines past ~160 characters, so
// cut on a word boundary rather than letting them do it mid-word. The word
// boundary is only honored if it doesn't throw away more than a quarter of the
// budget — otherwise a description whose first word is long would fall back to
// a mid-word cut anyway, which is still better than returning almost nothing.
function metaDescription(text, limit = 160) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const minBoundary = Math.floor(limit * 0.25);
  return `${(lastSpace > minBoundary ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, "")}…`;
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

// ── Layout ────────────────────────────────────────────────────────────────────

const NAV = [
  ["/", "terminal"],
  ["/portfolio/", "portfolio"],
  ["/team/", "team"],
  ["/about/", "about"],
  ["/jobs/", "jobs"],
];

function renderNav(currentPath) {
  // The whitespace around the separator is load-bearing: without it the whole
  // nav is one unbreakable run and overflows narrow viewports.
  const links = NAV.map(([href, label]) =>
    href === currentPath
      ? `<span aria-current="page">${esc(label)}</span>`
      : `<a href="${esc(href)}">${esc(label)}</a>`
  ).join(' <span class="sep" aria-hidden="true">/</span> ');
  return `<nav aria-label="Sections">${links}</nav>`;
}

// A prompt line echoing the terminal command that shows the same content.
// Decorative, so it is hidden from assistive tech.
function renderPrompt(command) {
  return (
    `<p class="prompt" aria-hidden="true">` +
    `<span class="user">guest@root</span>` +
    `<span class="punct">:</span><span class="path">~</span>` +
    `<span class="punct">$</span> ` +
    `<span class="cmd">${esc(command)}</span></p>`
  );
}

function layout({ title, description, pathname, command, body, graph }) {
  const canonical = absUrl(pathname);
  const jsonLd = jsonLdScript({ "@context": "https://schema.org", "@graph": graph });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(canonical)}" />
    <link rel="shortcut icon" href="/favicon.png" />
    <meta property="og:site_name" content="Root Ventures" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(canonical)}" />
    <meta property="og:image" content="${esc(OG_IMAGE)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@rootvc" />
    <meta name="twitter:creator" content="@rootvc" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(OG_IMAGE)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Source+Code+Pro:400,700&display=swap"
    />
    <link rel="stylesheet" href="/css/pages.css" />
    ${jsonLd}
  </head>
  <body>
    <div class="window">
      <header>
        ${renderNav(pathname)}
      </header>
      <main id="main">
${renderPrompt(command)}
${body}
      </main>
      <footer>
        <p>This is the plain-text version of <a href="/">root.vc</a>, which is a terminal. Everything here is also available by typing <code>${esc(command)}</code> there.</p>
      </footer>
    </div>
  </body>
</html>
`;
}

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
      "@id": `${ORIGIN}/team/${slug}/#person`,
    })),
  };
}

function breadcrumbNode(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, pathname], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absUrl(pathname),
    })),
  };
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

// Deterministic sibling picker: company i links to i+1..i+n, wrapping around.
// Every company gets both outbound and inbound links, and — critically for the
// --check drift guard — the choice never varies between builds.
function siblings(slugs, index, count = 5) {
  const picked = [];
  for (let offset = 1; offset <= count && offset < slugs.length; offset += 1) {
    picked.push(slugs[(index + offset) % slugs.length]);
  }
  return picked;
}

function renderPortfolioIndex({ firm, portfolio }) {
  const slugs = Object.keys(portfolio);
  const items = slugs
    .map((slug) => {
      const company = portfolio[slug];
      return (
        `        <li>\n` +
        `          <a href="/portfolio/${esc(slug)}/"><strong>${esc(company.name)}</strong></a>\n` +
        `          <span class="desc">${esc(company.description)}</span>\n` +
        `        </li>`
      );
    })
    .join("\n");

  const body = `        <h1>Portfolio</h1>
        <p class="lede">${esc(firm.blurb)}</p>
        <p>${slugs.length} companies.</p>
        <ul class="listing">
${items}
        </ul>`;

  return {
    path: "portfolio/index.html",
    content: layout({
      title: "Portfolio — Root Ventures",
      description: metaDescription(
        `All ${slugs.length} companies backed by Root Ventures, a San Francisco deep tech seed fund investing in robotics, hardware, manufacturing, and developer tools.`
      ),
      pathname: "/portfolio/",
      command: "tldr",
      body,
      graph: [
        {
          "@type": "CollectionPage",
          "@id": `${absUrl("/portfolio/")}#page`,
          url: absUrl("/portfolio/"),
          name: "Root Ventures Portfolio",
          isPartOf: { "@id": `${ORIGIN}/#website` },
          about: { "@id": ORG_ID },
        },
        {
          "@type": "ItemList",
          name: "Root Ventures portfolio companies",
          numberOfItems: slugs.length,
          itemListElement: slugs.map((slug, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: portfolio[slug].name,
            url: absUrl(`/portfolio/${slug}/`),
          })),
        },
        breadcrumbNode([
          ["Root Ventures", "/"],
          ["Portfolio", "/portfolio/"],
        ]),
      ],
    }),
  };
}

function renderCompany({ firm, portfolio }, slug, index) {
  const slugs = Object.keys(portfolio);
  const company = portfolio[slug];
  const pathname = `/portfolio/${slug}/`;

  const facts = [];
  if (hasLink(company.url)) {
    facts.push(
      `          <dt>Website</dt>\n          <dd><a href="${esc(company.url)}" rel="noopener">${esc(company.url.replace(/^https?:\/\//, ""))}</a></dd>`
    );
  }
  if (hasLink(company.demo)) {
    facts.push(
      `          <dt>Try it</dt>\n          <dd><a href="${esc(company.demo)}" rel="noopener">${esc(company.demo)}</a></dd>`
    );
  }
  if (hasLink(company.memo)) {
    facts.push(
      `          <dt>Investment memo</dt>\n          <dd><a href="${esc(company.memo)}" rel="noopener">Why we invested</a></dd>`
    );
  }
  const factList = facts.length
    ? `        <dl class="facts">\n${facts.join("\n")}\n        </dl>`
    : "";

  const related = siblings(slugs, index)
    .map(
      (other) =>
        `          <li><a href="/portfolio/${esc(other)}/">${esc(portfolio[other].name)}</a> <span class="desc">${esc(portfolio[other].description)}</span></li>`
    )
    .join("\n");

  const body = `        <h1>${esc(company.name)}</h1>
        <p class="lede">${esc(company.description)}</p>
${factList}
        <p>${esc(company.name)} is a ${esc(firm.name)} portfolio company. ${esc(firm.blurb)}</p>
        <h2>More from the portfolio</h2>
        <ul class="listing">
${related}
        </ul>
        <p><a href="/portfolio/">All ${slugs.length} portfolio companies</a></p>`;

  const companyNode = {
    "@type": "Organization",
    "@id": `${absUrl(pathname)}#company`,
    name: company.name,
    description: company.description,
    image: `${ORIGIN}/images/${slug}.jpg`,
    funder: { "@id": ORG_ID },
  };
  if (hasLink(company.url)) companyNode.url = company.url;

  return {
    path: `portfolio/${slug}/index.html`,
    content: layout({
      title: `${company.name} — Root Ventures portfolio`,
      description: metaDescription(
        `${company.description} ${company.name} is a Root Ventures portfolio company.`
      ),
      pathname,
      command: `tldr ${slug}`,
      body,
      graph: [
        {
          "@type": "WebPage",
          "@id": `${absUrl(pathname)}#page`,
          url: absUrl(pathname),
          name: `${company.name} — Root Ventures portfolio`,
          isPartOf: { "@id": `${ORIGIN}/#website` },
          about: { "@id": `${absUrl(pathname)}#company` },
        },
        companyNode,
        breadcrumbNode([
          ["Root Ventures", "/"],
          ["Portfolio", "/portfolio/"],
          [company.name, pathname],
        ]),
      ],
    }),
  };
}

// ── Team ──────────────────────────────────────────────────────────────────────

function renderTeamIndex({ firm, team }) {
  const slugs = Object.keys(team);
  const items = slugs
    .map(
      (slug) =>
        `        <li>\n` +
        `          <a href="/team/${esc(slug)}/"><strong>${esc(team[slug].name)}</strong></a>\n` +
        `          <span class="role">${esc(team[slug].title)}</span>\n` +
        `          <span class="desc">${esc(team[slug].description)}</span>\n` +
        `        </li>`
    )
    .join("\n");

  const body = `        <h1>Team</h1>
        <p class="lede">${esc(firm.blurb)}</p>
        <ul class="listing">
${items}
        </ul>`;

  return {
    path: "team/index.html",
    content: layout({
      title: "Team — Root Ventures",
      description: metaDescription(
        `The partners and operators behind Root Ventures, a San Francisco deep tech seed fund: ${slugs
          .map((slug) => team[slug].name)
          .join(", ")}.`
      ),
      pathname: "/team/",
      command: "whois",
      body,
      graph: [
        {
          "@type": "CollectionPage",
          "@id": `${absUrl("/team/")}#page`,
          url: absUrl("/team/"),
          name: "Root Ventures Team",
          isPartOf: { "@id": `${ORIGIN}/#website` },
          about: { "@id": ORG_ID },
        },
        {
          "@type": "ItemList",
          name: "Root Ventures team",
          numberOfItems: slugs.length,
          itemListElement: slugs.map((slug, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: team[slug].name,
            url: absUrl(`/team/${slug}/`),
          })),
        },
        breadcrumbNode([
          ["Root Ventures", "/"],
          ["Team", "/team/"],
        ]),
      ],
    }),
  };
}

function renderPerson({ firm, team }, slug) {
  const person = team[slug];
  const pathname = `/team/${slug}/`;
  const email = `${slug}@root.vc`;

  const others = Object.keys(team)
    .filter((other) => other !== slug)
    .map(
      (other) =>
        `          <li><a href="/team/${esc(other)}/">${esc(team[other].name)}</a> <span class="role">${esc(team[other].title)}</span></li>`
    )
    .join("\n");

  const linkedinFact = hasLink(person.linkedin)
    ? `          <dt>LinkedIn</dt>\n          <dd><a href="${esc(person.linkedin)}" rel="noopener">${esc(person.name)}</a></dd>\n`
    : "";

  const body = `        <h1>${esc(person.name)}</h1>
        <p class="role">${esc(person.title)}, ${esc(firm.name)}</p>
        <p class="lede">${esc(person.description)}</p>
        <dl class="facts">
          <dt>Email</dt>
          <dd><a href="mailto:${esc(email)}">${esc(email)}</a></dd>
${linkedinFact}        </dl>
        <h2>The rest of the team</h2>
        <ul class="listing">
${others}
        </ul>`;

  return {
    path: `team/${slug}/index.html`,
    content: layout({
      title: `${person.name}, ${person.title} — Root Ventures`,
      description: metaDescription(
        `${person.name} is ${person.title} at Root Ventures. ${person.description}`
      ),
      pathname,
      command: `whois ${slug}`,
      body,
      graph: [
        {
          "@type": "ProfilePage",
          "@id": `${absUrl(pathname)}#page`,
          url: absUrl(pathname),
          name: `${person.name} — Root Ventures`,
          isPartOf: { "@id": `${ORIGIN}/#website` },
          mainEntity: { "@id": `${absUrl(pathname)}#person` },
        },
        {
          "@type": "Person",
          "@id": `${absUrl(pathname)}#person`,
          name: person.name,
          jobTitle: person.title,
          description: person.description,
          url: absUrl(pathname),
          image: `${ORIGIN}/images/${slug}.png`,
          email,
          worksFor: { "@id": ORG_ID },
          sameAs: hasLink(person.linkedin) ? [person.linkedin] : undefined,
        },
        breadcrumbNode([
          ["Root Ventures", "/"],
          ["Team", "/team/"],
          [person.name, pathname],
        ]),
      ],
    }),
  };
}

// ── About ─────────────────────────────────────────────────────────────────────

function renderAbout({ firm, portfolio, team }) {
  const { streetAddress, addressLocality, addressRegion, postalCode } = firm.address;

  const body = `        <h1>About Root Ventures</h1>
        <p class="lede">${esc(firm.blurb)}</p>
        <dl class="facts">
          <dt>Thesis</dt>
          <dd>${esc(firm.thesis)}</dd>
          <dt>Mission</dt>
          <dd>${esc(firm.tagline)}</dd>
          <dt>Fund size</dt>
          <dd>${esc(firm.fundSize)}</dd>
          <dt>Typical check</dt>
          <dd>${esc(firm.checkSize)}</dd>
          <dt>Stage</dt>
          <dd>Seed, usually leading the initial round</dd>
          <dt>Focus</dt>
          <dd>${esc(firm.focusAreas.join(", "))}</dd>
          <dt>Office</dt>
          <dd>${esc(streetAddress)}, ${esc(addressLocality)}, ${esc(addressRegion)} ${esc(postalCode)}</dd>
          <dt>Email</dt>
          <dd><a href="mailto:${esc(firm.email)}">${esc(firm.email)}</a></dd>
        </dl>
        <h2>Where to go next</h2>
        <ul class="listing">
          <li><a href="/portfolio/">Portfolio</a> <span class="desc">${Object.keys(portfolio).length} companies we have backed.</span></li>
          <li><a href="/team/">Team</a> <span class="desc">The ${Object.keys(team).length} people behind the fund.</span></li>
          <li><a href="/jobs/">Jobs</a> <span class="desc">Open roles at Root Ventures.</span></li>
        </ul>`;

  return {
    path: "about/index.html",
    content: layout({
      title: "About — Root Ventures",
      description: metaDescription(firm.blurb),
      pathname: "/about/",
      command: "whois root",
      body,
      graph: [
        {
          "@type": "AboutPage",
          "@id": `${absUrl("/about/")}#page`,
          url: absUrl("/about/"),
          name: "About Root Ventures",
          isPartOf: { "@id": `${ORIGIN}/#website` },
          mainEntity: { "@id": ORG_ID },
        },
        organizationNode(firm, team),
        breadcrumbNode([
          ["Root Ventures", "/"],
          ["About", "/about/"],
        ]),
      ],
    }),
  };
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

// jobs[id] is an array of terminal lines: [0] is the title, blank strings
// separate paragraphs, and lines starting with "•" are bullets. Reassemble that
// into real HTML paragraphs and lists.
function renderJobLines(lines) {
  const html = [];
  let paragraph = [];
  let bullets = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`        <p>${esc(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushBullets = () => {
    if (bullets.length) {
      html.push(
        `        <ul>\n${bullets.map((b) => `          <li>${esc(b)}</li>`).join("\n")}\n        </ul>`
      );
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flushParagraph();
      flushBullets();
    } else if (line.startsWith("•")) {
      flushParagraph();
      bullets.push(line.replace(/^•\s*/, ""));
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushBullets();

  return html.join("\n");
}

function renderJobs({ firm, jobs }) {
  const ids = Object.keys(jobs);
  const sections = ids
    .map((id) => {
      const [title, ...rest] = jobs[id];
      return `        <h2>${esc(title)}</h2>\n${renderJobLines(rest)}`;
    })
    .join("\n");

  const body = `        <h1>Jobs at Root Ventures</h1>
        <p class="lede">${esc(firm.blurb)}</p>
${sections}
        <h2>How to apply</h2>
        <p>Email <a href="mailto:${esc(firm.email)}">${esc(firm.email)}</a>, or run <code>apply ${esc(ids[0])}</code> in <a href="/">the terminal</a>.</p>`;

  return {
    path: "jobs/index.html",
    content: layout({
      title: "Jobs — Root Ventures",
      description: metaDescription(
        `Open roles at Root Ventures, a San Francisco deep tech seed fund: ${ids
          .map((id) => jobs[id][0])
          .join(", ")}.`
      ),
      pathname: "/jobs/",
      command: "jobs",
      body,
      graph: [
        {
          "@type": "WebPage",
          "@id": `${absUrl("/jobs/")}#page`,
          url: absUrl("/jobs/"),
          name: "Jobs at Root Ventures",
          isPartOf: { "@id": `${ORIGIN}/#website` },
          about: { "@id": ORG_ID },
        },
        breadcrumbNode([
          ["Root Ventures", "/"],
          ["Jobs", "/jobs/"],
        ]),
      ],
    }),
  };
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
  // netlify.toml publishes the repo root, so build tooling is served too. Keep
  // that out of indexes — but never /js/, /css/, or /config/: crawlers have to
  // fetch all three to render the terminal and welcome.htm, both of which build
  // their content from config/*.js at runtime.
  const blocks = [
    "# root.vc — https://root.vc",
    "# AI crawlers are welcome here. The plain-text mirror of the terminal",
    "# lives at /portfolio/, /team/, /about/, /jobs/, and in /llms.txt.",
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

function renderLlmsTxt({ firm, portfolio, team, jobs }) {
  const lines = [
    `# ${firm.name}`,
    "",
    `> ${firm.blurb}`,
    "",
    `${firm.name} is a seed-stage venture capital firm in ${firm.address.addressLocality}, ${firm.address.addressRegion}. Mission: ${firm.tagline}. Thesis: ${firm.thesis} Fund size ${firm.fundSize}, typical check ${firm.checkSize}. Focus areas: ${firm.focusAreas.join(", ")}.`,
    "",
    `The website at ${ORIGIN} is an interactive terminal; this file and the pages it links are the plain-text equivalent.`,
    "",
    "## About",
    "",
    `- [About ${firm.name}](${absUrl("/about/")}): fund details, thesis, office, and contact.`,
    `- [Jobs](${absUrl("/jobs/")}): ${
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
      `- [${team[slug].name}](${absUrl(`/team/${slug}/`)}): ${team[slug].title}. ${team[slug].description}`
    );
  }

  lines.push("", "## Portfolio", "");
  for (const slug of Object.keys(portfolio)) {
    lines.push(
      `- [${portfolio[slug].name}](${absUrl(`/portfolio/${slug}/`)}): ${portfolio[slug].description}`
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
    lines.push(`Page: ${absUrl(`/team/${slug}/`)}`, "");
  }

  lines.push(`## Portfolio (${Object.keys(portfolio).length} companies)`, "");
  for (const slug of Object.keys(portfolio)) {
    const company = portfolio[slug];
    lines.push(`### ${company.name}`, "", company.description, "");
    if (hasLink(company.url)) lines.push(`Website: ${company.url}`);
    if (hasLink(company.demo)) lines.push(`Demo: ${company.demo}`);
    if (hasLink(company.memo)) lines.push(`Investment memo: ${company.memo}`);
    lines.push(`Page: ${absUrl(`/portfolio/${slug}/`)}`, "");
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

// ── index.html <noscript> injection ───────────────────────────────────────────

// Most LLM crawlers do not execute JavaScript, so on the homepage they see an
// empty <div id="terminal">. This block gives them the whole map. JS-enabled
// visitors never render it, so the terminal is visually untouched.
function renderNoscriptIndex({ firm, portfolio, team }) {
  const companies = Object.keys(portfolio)
    .map(
      (slug) =>
        `            <li><a href="/portfolio/${esc(slug)}/">${esc(portfolio[slug].name)}</a> — ${esc(portfolio[slug].description)}</li>`
    )
    .join("\n");
  const people = Object.keys(team)
    .map(
      (slug) =>
        `            <li><a href="/team/${esc(slug)}/">${esc(team[slug].name)}</a> — ${esc(team[slug].title)}</li>`
    )
    .join("\n");

  return `${NOSCRIPT_BEGIN}
      <noscript>
        <div id="text-version">
          <p>${esc(firm.blurb)}</p>
          <p>
            <a href="/about/">About</a> ·
            <a href="/portfolio/">Portfolio</a> ·
            <a href="/team/">Team</a> ·
            <a href="/jobs/">Jobs</a>
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
      </noscript>
      ${NOSCRIPT_END}`;
}

// Every generated page points `isPartOf` at #website and `funder`/`worksFor` at
// #organization. Those nodes have to actually exist somewhere, and the homepage
// is where search engines look for them.
function renderHomeJsonLd({ firm, team }) {
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
  html = injectBetween(
    html,
    NOSCRIPT_BEGIN,
    NOSCRIPT_END,
    renderNoscriptIndex(config)
  );
  return html;
}

// ── Orchestration ─────────────────────────────────────────────────────────────

function buildPages(config = loadConfig()) {
  const { portfolio, team } = config;
  const files = [];

  files.push(renderAbout(config));
  files.push(renderJobs(config));
  files.push(renderPortfolioIndex(config));
  Object.keys(portfolio).forEach((slug, index) => {
    files.push(renderCompany(config, slug, index));
  });
  files.push(renderTeamIndex(config));
  Object.keys(team).forEach((slug) => {
    files.push(renderPerson(config, slug));
  });

  // Sitemap covers the terminal, the GeoCities page, and every generated page.
  // No <lastmod>: it would change on every build and make the --check drift
  // guard fail permanently.
  const urls = [
    `${ORIGIN}/`,
    `${ORIGIN}/welcome.htm`,
    ...files.map((file) => absUrl(`/${file.path.replace(/index\.html$/, "")}`)),
  ];

  files.push({ path: "sitemap.xml", content: renderSitemap(urls) });
  files.push({ path: "robots.txt", content: renderRobots() });
  files.push({ path: "llms.txt", content: renderLlmsTxt(config) });
  files.push({ path: "llms-full.txt", content: renderLlmsFull(config) });

  files.push({ path: "index.html", content: renderIndexHtml(config) });

  return files;
}

function writePages() {
  const files = buildPages();
  for (const file of files) {
    writeText(file.path, file.content);
  }
  console.log(
    `static mirror: ${files.length} files (${files.filter((f) => f.path.endsWith("index.html")).length} pages)`
  );
  return files;
}

// Regenerate in memory and compare against disk. Pure — no console output, no
// process.exit — so tests can call it directly and assert on the result. The
// CLI-facing checkPages() below is the thin wrapper that reports and exits.
function findDrift(files = buildPages()) {
  const drifted = [];

  for (const file of files) {
    const absolutePath = path.join(rootDir, file.path);
    const onDisk = fs.existsSync(absolutePath)
      ? fs.readFileSync(absolutePath, "utf8")
      : null;
    if (onDisk !== file.content) {
      drifted.push(onDisk === null ? `${file.path} (missing)` : file.path);
    }
  }

  return { files, drifted };
}

// Used by CI so a config edit that was pushed without a rebuild fails loudly
// instead of shipping stale HTML. Exits the process on drift — call
// findDrift() directly in tests instead of this.
function checkPages() {
  const { files, drifted } = findDrift();

  if (drifted.length) {
    console.error(
      `${drifted.length} generated file(s) are out of sync with config/*.js:`
    );
    drifted.forEach((file) => console.error(`  ${file}`));
    console.error("\nRun `npm run build` and commit the result.");
    process.exit(1);
  }

  console.log(`static mirror: ${files.length} files in sync with config/*.js`);
  return files;
}

module.exports = {
  AI_CRAWLERS,
  ORIGIN,
  buildPages,
  checkPages,
  esc,
  findDrift,
  injectBetween,
  loadConfig,
  metaDescription,
  renderCompany,
  renderIndexHtml,
  renderNoscriptIndex,
  renderPerson,
  writePages,
};

if (require.main === module) {
  if (process.argv.includes("--check")) {
    checkPages();
  } else {
    writePages();
  }
}
