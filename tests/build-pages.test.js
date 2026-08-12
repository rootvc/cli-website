import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { createBrowserEnv, REPO_ROOT } from "./helpers/browser-env";
import buildPagesModule from "../scripts/build-pages.js";
import buildAssetsModule from "../scripts/build-assets.js";

const {
  AI_CRAWLERS,
  COMMANDS,
  ORIGIN,
  buildPages,
  deepLink,
  esc,
  loadConfig,
  renderIndexHtml,
} = buildPagesModule;

const config = loadConfig();
const files = buildPages(config);

// index.html is the only page now. The static mirror that used to live at
// /portfolio/, /team/, /about/ and /jobs/ is gone; see the header of
// scripts/build-pages.js.
const htmlPages = files.filter((file) => file.path.endsWith(".html"));

function fileNamed(name) {
  const found = files.find((file) => file.path === name);
  if (!found) throw new Error(`generator did not emit ${name}`);
  return found.content;
}

function parse(content) {
  return new JSDOM(content).window.document;
}

// "portfolio/zed/index.html" -> "/portfolio/zed/"
function pathnameFor(filePath) {
  return `/${filePath.replace(/index\.html$/, "")}`;
}

let env;
afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
});

describe("loadConfig", () => {
  // Exercises the require() path into config/*.js — if a guarded exports footer
  // ever went missing, every field below would be undefined.
  it("returns the pure-data globals from config/*.js", () => {
    expect(Object.keys(config.portfolio).length).toBeGreaterThan(0);
    expect(Object.keys(config.team).length).toBeGreaterThan(0);
    expect(Object.keys(config.jobs).length).toBeGreaterThan(0);
    expect(config.firm.address.streetAddress).toBeTruthy();
    expect(config.firm.fundSize).toBeTruthy();
    expect(config.firm.blurb).toBeTruthy();
  });
});

describe("config/*.js stay classic browser scripts", () => {
  // They are concatenated into one non-module script by build-assets.js and
  // loaded via raw <script src> tags in welcome.htm. ESM syntax would make them
  // modules and break both paths. The pure-data files also carry a guarded
  // `module.exports` footer so build-pages.js can require() them; that is only
  // safe while it stays behind the `typeof module` check, since an unguarded
  // reference to `module` is a ReferenceError in a browser.
  const configFiles = fs
    .readdirSync(path.join(REPO_ROOT, "config"))
    .filter((name) => name.endsWith(".js"));

  it.each(configFiles)("%s has no ESM syntax", (name) => {
    const source = fs.readFileSync(path.join(REPO_ROOT, "config", name), "utf8");
    expect(source).not.toMatch(/^\s*(export|import)\s/m);
  });

  it.each(configFiles)("%s guards any module.exports", (name) => {
    const source = fs.readFileSync(path.join(REPO_ROOT, "config", name), "utf8");
    for (const line of source.split("\n")) {
      if (!/\bmodule\.exports\b/.test(line)) continue;
      expect(line).toMatch(/if \(typeof module !== "undefined"\)/);
    }
  });

  it("still populates the terminal's globals when loaded in a browser", () => {
    // The other half of dual-mode: `module` genuinely is undefined here, so the
    // guard is load-bearing rather than decorative, and the data still lands as
    // the bare globals config/commands.js reads at the top level.
    env = createBrowserEnv();
    env.loadScripts([
      "config/firm.js",
      "config/portfolio.js",
      "config/team.js",
      "config/jobs.js",
    ]);

    const values = env.exportValues(["firm", "portfolio", "team", "jobs", "module"]);
    expect(values.module).toBeUndefined();
    expect(values.firm.blurb).toBeTruthy();
    for (const name of ["portfolio", "team", "jobs"]) {
      expect(Object.keys(values[name]).length).toBeGreaterThan(0);
    }
  });
});

describe("script load order", () => {
  it("welcome.htm loads config/firm.js before config/commands.js", () => {
    // commands.js reads `firm` at the top level, so the reverse order is a
    // temporal-dead-zone crash that takes out buildGeoPage(). Read the real
    // <script> tags rather than raw offsets, so prose in a comment that happens
    // to name a file cannot swing the result.
    const source = fs.readFileSync(path.join(REPO_ROOT, "welcome.htm"), "utf8");
    const srcs = [...source.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);

    expect(srcs).toContain("config/firm.js");
    expect(srcs.indexOf("config/firm.js")).toBeLessThan(
      srcs.indexOf("config/commands.js")
    );
  });

  it("welcome.htm declares a document language", () => {
    const doc = parse(fs.readFileSync(path.join(REPO_ROOT, "welcome.htm"), "utf8"));
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
  });

  it("the app bundle lists config/firm.js before config/commands.js", () => {
    // Same constraint, enforced on the concatenation order in build-assets.js.
    const { appBundleSources } = buildAssetsModule;
    expect(appBundleSources).toContain("config/firm.js");
    expect(appBundleSources.indexOf("config/firm.js")).toBeLessThan(
      appBundleSources.indexOf("config/commands.js")
    );
  });
});

describe("one page, no mirror", () => {
  // The mirror existed to make the terminal readable to crawlers, and it worked
  // — well enough that Google indexed all 70-odd pages and started showing
  // sitelinks to About / Team / Jobs, advertising a conventional website behind
  // the terminal. Content now lives on the homepage and is addressed by URL
  // fragment. These assert the mirror does not creep back.

  it("emits index.html and nothing else that is HTML", () => {
    expect(htmlPages.map((file) => file.path)).toEqual(["index.html"]);
  });

  it("emits no page at any old mirror path", () => {
    for (const slug of Object.keys(config.portfolio)) {
      expect(files.some((f) => f.path.startsWith(`portfolio/${slug}`))).toBe(false);
    }
    for (const slug of Object.keys(config.team)) {
      expect(files.some((f) => f.path.startsWith(`team/${slug}`))).toBe(false);
    }
    for (const dir of ["about", "jobs", "portfolio", "team"]) {
      expect(files.some((f) => f.path.startsWith(`${dir}/`))).toBe(false);
    }
  });

  it("builds every deep link from the same helper the terminal parses", () => {
    // js/terminal-ext.js splits the fragment on the FIRST hyphen, so a
    // hyphenated slug still resolves to one argument. If that ever changes it
    // has to change in deepLink() too, and this is the seam between them.
    expect(deepLink("whois avidan")).toBe("/#whois-avidan");
    expect(deepLink(COMMANDS.company("vibe-robotics"))).toBe(
      "/#tldr-vibe-robotics"
    );
    expect(deepLink(COMMANDS.about)).toBe("/#whois-root");
  });
});

describe("escaping", () => {
  const hostile = {
    name: 'A & B <script>alert(1)</script>',
    url: 'https://example.com/?a=1&b="2"',
    description: `He said "hi" & <b>waved</b> — </script><img src=x onerror=alert(1)>`,
    demo: null,
    memo: null,
  };

  // Everything is injected into the one page now, so hostile config data has
  // exactly one place to escape from.
  const hostileConfig = {
    firm: config.firm,
    portfolio: { evil: hostile, other: hostile },
    team: { evil: { ...hostile, title: hostile.name } },
    jobs: {},
  };

  it("escapes hostile data in the homepage HTML and JSON-LD", () => {
    const html = renderIndexHtml(hostileConfig);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x onerror");
    expect(html).toContain("&amp;");

    // Each generated block is checked on its own, since the page's real
    // <script defer src> tags sit between them. An extra script inside either
    // means the payload broke out of an attribute or text node.
    const between = (marker) =>
      html.slice(html.indexOf(`BEGIN ${marker}`), html.indexOf(`END ${marker}`));

    const scripts = parse(between("generated-jsonld")).querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].type).toBe("application/ld+json");

    // The text block is pure markup; nothing should be executable in it.
    expect(
      parse(between("generated-index")).querySelectorAll("script")
    ).toHaveLength(0);
  });

  it("keeps </script> from terminating the JSON-LD block", () => {
    const script = parse(renderIndexHtml(hostileConfig)).querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script.textContent).not.toContain("</script");
    expect(() => JSON.parse(script.textContent)).not.toThrow();
  });

  it("esc handles the five HTML-significant characters", () => {
    expect(esc(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});

describe("_redirects", () => {
  const redirects = fileNamed("_redirects");
  const rules = redirects
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/));

  it("sends every old mirror path into the terminal", () => {
    // A 404 would let the indexed URL decay on its own and strand any inbound
    // link. A 301 tells Google to drop it and fold its signals into the
    // homepage, and still lands a visitor on the right content.
    const destinations = Object.fromEntries(rules.map((r) => [r[0], r[1]]));
    expect(destinations["/about/"]).toBe("/#whois-root");
    expect(destinations["/jobs/"]).toBe("/#jobs");
    expect(destinations["/portfolio/"]).toBe("/#tldr");
    expect(destinations["/team/"]).toBe("/#whois");
    expect(destinations["/portfolio/:slug/"]).toBe("/#tldr-:slug");
    expect(destinations["/team/:slug/"]).toBe("/#whois-:slug");
  });

  it("covers both the bare and trailing-slash form of every path", () => {
    const froms = new Set(rules.map((r) => r[0]));
    for (const base of [
      "/about",
      "/jobs",
      "/portfolio",
      "/team",
      "/portfolio/:slug",
      "/team/:slug",
    ]) {
      expect(froms).toContain(base);
      expect(froms).toContain(`${base}/`);
    }
  });

  it("matches the exact paths before the :slug patterns", () => {
    // Netlify takes the first rule that matches, so a :slug pattern listed
    // above /portfolio/ would swallow the index redirect.
    const order = rules.map((r) => r[0]);
    expect(order.indexOf("/portfolio/")).toBeLessThan(
      order.indexOf("/portfolio/:slug")
    );
    expect(order.indexOf("/team/")).toBeLessThan(order.indexOf("/team/:slug"));
  });

  it("uses a permanent redirect for all of them", () => {
    for (const rule of rules) {
      expect(rule[2]).toBe("301");
    }
  });
});

describe("JSON-LD", () => {
  it.each(htmlPages.map((file) => file.path))("%s emits valid JSON-LD", (filePath) => {
    const page = htmlPages.find((file) => file.path === filePath);
    const blocks = parse(page.content).querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(blocks.length).toBeGreaterThan(0);

    for (const block of blocks) {
      const data = JSON.parse(block.textContent);
      expect(data["@context"]).toBe("https://schema.org");
      expect(Array.isArray(data["@graph"])).toBe(true);
      for (const node of data["@graph"]) {
        expect(node["@type"]).toBeTruthy();
      }
    }
  });

  it("defines every @id that pages reference", () => {
    // A dangling @id reference is a node that says "see over there" when
    // nothing is over there. #website and #organization live on the homepage;
    // #person nodes live on the team pages.
    const defined = new Set();
    const referenced = new Set();

    for (const page of htmlPages) {
      for (const block of parse(page.content).querySelectorAll(
        'script[type="application/ld+json"]'
      )) {
        const walk = (node, isTopLevel) => {
          if (Array.isArray(node)) return node.forEach((n) => walk(n, isTopLevel));
          if (!node || typeof node !== "object") return;
          if (node["@id"]) {
            // A node with @type defines its @id; a bare {"@id": ...} references one.
            (node["@type"] ? defined : referenced).add(node["@id"]);
          }
          for (const value of Object.values(node)) walk(value, false);
        };
        walk(JSON.parse(block.textContent)["@graph"], true);
      }
    }

    const dangling = [...referenced].filter((id) => !defined.has(id));
    expect(dangling).toEqual([]);
  });

  // With one page left, everything that used to be the mainEntity of its own
  // page is a node in the homepage graph, keyed by a fragment @id so a parser
  // can still address each one individually.
  const homeGraph = JSON.parse(
    parse(fileNamed("index.html")).querySelector(
      'script[type="application/ld+json"]'
    ).textContent
  )["@graph"];

  it("carries a node for every company and every person", () => {
    for (const slug of Object.keys(config.portfolio)) {
      const node = homeGraph.find(
        (n) => n["@id"] === `${ORIGIN}/#company-${slug}`
      );
      expect(node, `missing company node for ${slug}`).toBeTruthy();
      expect(node.name).toBe(config.portfolio[slug].name);
    }
    for (const slug of Object.keys(config.team)) {
      const node = homeGraph.find(
        (n) => n["@id"] === `${ORIGIN}/#person-${slug}`
      );
      expect(node, `missing person node for ${slug}`).toBeTruthy();
      expect(node.name).toBe(config.team[slug].name);
    }
  });

  it("models investment from the company, not the fund", () => {
    const slug = Object.keys(config.portfolio)[0];
    const company = homeGraph.find(
      (node) => node["@id"] === `${ORIGIN}/#company-${slug}`
    );
    expect(company["@type"]).toBe("Organization");
    expect(company.funder["@id"]).toBe(`${ORIGIN}/#organization`);
  });

  it("keeps Person nodes attached to the firm", () => {
    const slug = Object.keys(config.team)[0];
    const person = homeGraph.find(
      (node) => node["@id"] === `${ORIGIN}/#person-${slug}`
    );
    expect(person["@type"]).toBe("Person");
    expect(person.jobTitle).toBe(config.team[slug].title);
    expect(person.worksFor["@id"]).toBe(`${ORIGIN}/#organization`);
    // The node's url is where root.vc actually shows this person.
    expect(person.url).toBe(`${ORIGIN}${deepLink(COMMANDS.person(slug))}`);
  });
});

describe("generated output stays out of the repo", () => {
  // The mirror is a build artifact, not a source file: it is written to dist/
  // and gitignored. That is what makes drift impossible, so it is worth
  // asserting rather than leaving to convention — a generated file committed
  // back to the repo root would silently reintroduce the stale-copy problem.
  it("emits nothing into the repo root", () => {
    const escaped = files.filter((file) =>
      fs.existsSync(path.join(REPO_ROOT, file.path))
    );
    // index.html is the one input the generator also emits: it reads the
    // committed template and writes the injected copy to dist/index.html.
    expect(escaped.map((file) => file.path)).toEqual(["index.html"]);
  });

  it.each(["generated-jsonld", "generated-index"])(
    "leaves the committed index.html template's %s region empty",
    (name) => {
      const template = fs.readFileSync(
        path.join(REPO_ROOT, "index.html"),
        "utf8"
      );
      const begin = template.indexOf(`<!-- BEGIN ${name} -->`);
      const end = template.indexOf(`<!-- END ${name} -->`);
      expect(begin).toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(begin);

      const between = template.slice(
        begin + `<!-- BEGIN ${name} -->`.length,
        end
      );
      expect(between.trim()).toBe("");
    }
  );

  it("regenerates identical output from an unchanged config", () => {
    // buildPages() must be deterministic — object-key order, no timestamps —
    // or every deploy would republish all 70-odd pages as changed.
    expect(buildPages(loadConfig())).toEqual(files);
  });
});

describe("search invisibility", () => {
  // root.vc is meant to be the only result Google shows. That is now structural
  // rather than a directive: there is one page, so there is nothing else for
  // Google to index and nothing to promote into sitelinks. Crawling is still
  // wide open, because the AI crawlers this content exists for need to fetch it.

  it("leaves the terminal homepage indexable", () => {
    // The whole point is that root.vc itself still ranks.
    const robots = parse(fileNamed("index.html")).querySelector(
      'meta[name="robots"]'
    );
    expect(robots?.content ?? "").not.toMatch(/\bnoindex\b/);
  });

  it("keeps welcome.htm out of search results too", () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, "welcome.htm"), "utf8");
    expect(source).toMatch(/<meta name="robots" content="[^"]*noindex/);
  });

  it("does not use robots.txt to hide anything from AI crawlers", () => {
    // A Disallow here would stop GPTBot/ClaudeBot/PerplexityBot from fetching
    // the content this whole arrangement exists to serve.
    const robots = fileNamed("robots.txt");
    for (const dir of ["/portfolio/", "/team/", "/about/", "/jobs/"]) {
      expect(robots).not.toContain(`Disallow: ${dir}`);
    }
    expect(robots).not.toContain("Disallow: /llms");
  });

  it("still exposes every company to LLM crawlers", () => {
    // llms.txt and the homepage text block are the discovery paths now that
    // there are no per-company pages to crawl.
    const llms = fileNamed("llms.txt");
    for (const [slug, company] of Object.entries(config.portfolio)) {
      expect(llms).toContain(`${ORIGIN}${deepLink(COMMANDS.company(slug))}`);
      expect(llms).toContain(company.description);
    }
  });
});

describe("sitemap.xml", () => {
  const sitemap = fileNamed("sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("uses the correct sitemap namespace", () => {
    expect(sitemap).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    );
  });

  it("lists the homepage and nothing else", () => {
    // Not a policy choice any more — there is genuinely one page.
    expect(locs).toEqual([`${ORIGIN}/`]);
  });

  it("never lists a fragment URL", () => {
    // Google strips fragments before indexing, so /#tldr-chargelab and / are
    // the same URL to it. Listing deep links would submit the homepage 70-odd
    // times over.
    for (const loc of locs) {
      expect(loc).not.toContain("#");
    }
  });

  it("only lists apex https URLs", () => {
    for (const loc of locs) {
      expect(loc.startsWith(`${ORIGIN}/`)).toBe(true);
      expect(loc).not.toContain("//www.");
    }
  });

  it("omits lastmod so the drift check stays stable", () => {
    // A build-time <lastmod> would change on every run and make
    // `npm run build:pages:check` fail permanently.
    expect(sitemap).not.toContain("<lastmod>");
  });
});

describe("robots.txt", () => {
  const robots = fileNamed("robots.txt");

  it("points at the sitemap", () => {
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it("explicitly allows every AI crawler", () => {
    for (const agent of AI_CRAWLERS) {
      expect(robots).toContain(`User-agent: ${agent}`);
    }
  });

  it("never disallows the whole site", () => {
    expect(robots.split("\n")).not.toContain("Disallow: /");
  });

  it("keeps rendering resources crawlable", () => {
    // Crawlers have to fetch all three to render anything: the terminal loads
    // js/app.bundle.js, and welcome.htm builds its tables from config/*.js at
    // runtime. Blocking them would make both pages look empty.
    for (const dir of ["/js/", "/css/", "/config/"]) {
      expect(robots).not.toContain(`Disallow: ${dir}`);
    }
  });

  it("keeps build tooling out of the index", () => {
    for (const dir of ["/scripts/", "/tests/", "/netlify/"]) {
      expect(robots).toContain(`Disallow: ${dir}`);
    }
  });
});

describe("llms.txt", () => {
  const llms = fileNamed("llms.txt");

  it("follows the llms.txt convention", () => {
    expect(llms.startsWith(`# ${config.firm.name}\n`)).toBe(true);
    expect(llms).toMatch(/^> /m);
    expect(llms).toContain("## Portfolio");
    expect(llms).toContain("## Team");
  });

  it("links every company and person at its deep link", () => {
    for (const [slug, company] of Object.entries(config.portfolio)) {
      expect(llms).toContain(
        `[${company.name}](${ORIGIN}${deepLink(COMMANDS.company(slug))})`
      );
    }
    for (const [slug, person] of Object.entries(config.team)) {
      expect(llms).toContain(
        `[${person.name}](${ORIGIN}${deepLink(COMMANDS.person(slug))})`
      );
    }
  });

  it("llms-full.txt carries the full descriptions", () => {
    const full = fileNamed("llms-full.txt");
    for (const company of Object.values(config.portfolio)) {
      expect(full).toContain(company.description);
    }
    for (const person of Object.values(config.team)) {
      expect(full).toContain(person.description);
    }
    expect(full).toContain(config.firm.address.streetAddress);
    expect(full).toContain(config.firm.fundSize);
  });
});

describe("internal links", () => {
  it("every internal href is a deep link the terminal can run", () => {
    // Nothing links to a path any more: the only internal destinations are
    // fragments, and each has to name a command that actually exists.
    const runnable = new Set([
      COMMANDS.about,
      COMMANDS.jobs,
      COMMANDS.portfolioIndex,
      COMMANDS.teamIndex,
      ...Object.keys(config.portfolio).map((slug) => COMMANDS.company(slug)),
      ...Object.keys(config.team).map((slug) => COMMANDS.person(slug)),
    ]);
    const expected = new Set([...runnable].map((command) => deepLink(command)));

    const broken = [];
    for (const page of htmlPages) {
      const block = page.content.slice(
        page.content.indexOf("BEGIN generated-index"),
        page.content.indexOf("END generated-index")
      );
      for (const anchor of parse(block).querySelectorAll("a[href^='/']")) {
        const href = anchor.getAttribute("href");
        if (expected.has(href)) continue;
        broken.push(`${page.path} -> ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("JSON-LD image references exist on disk", () => {
    for (const slug of Object.keys(config.portfolio)) {
      expect(fs.existsSync(path.join(REPO_ROOT, `images/${slug}.jpg`))).toBe(true);
    }
    for (const slug of Object.keys(config.team)) {
      expect(fs.existsSync(path.join(REPO_ROOT, `images/${slug}.png`))).toBe(true);
    }
  });

  it("never emits the (inactive) URL sentinel as a link", () => {
    // config/portfolio.js can carry url: "(inactive)" (see js/geo.js).
    const html = renderIndexHtml({
      firm: config.firm,
      portfolio: {
        gone: { name: "Gone", url: "(inactive)", description: "No longer with us." },
      },
      team: config.team,
      jobs: {},
    });
    expect(html).not.toContain("(inactive)");
    expect(html).not.toContain('href=""');
  });

  it("never turns a non-http(s) scheme in config data into a live href", () => {
    // config/*.js is only editable by whoever can already edit the terminal's
    // own code, so this isn't defending against an outside attacker — it's a
    // guard against a bad value (a stray "javascript:" paste, a malformed
    // entry) turning into unsafe or broken markup instead of being dropped.
    const html = renderIndexHtml({
      firm: config.firm,
      portfolio: {
        evil: {
          name: "Evil Corp",
          url: "javascript:alert(1)",
          demo: "data:text/html,<script>alert(1)</script>",
          description: "Not a real company.",
        },
      },
      team: config.team,
      jobs: {},
    });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");

    const graph = JSON.parse(
      parse(html).querySelector('script[type="application/ld+json"]').textContent
    )["@graph"];
    const company = graph.find((node) => node["@id"].endsWith("#company-evil"));
    expect(company.url).toBeUndefined();
  });
});

describe("index.html", () => {
  const html = fileNamed("index.html");
  const doc = parse(html);

  it("declares the apex canonical", () => {
    expect(doc.querySelector('link[rel="canonical"]').href).toBe(`${ORIGIN}/`);
    expect(doc.querySelector('meta[property="og:url"]').content).toBe(`${ORIGIN}/`);
  });

  it("declares a document language", () => {
    // Matters for screen readers (correct pronunciation) and is a small SEO
    // signal; every generated page has it, so the hand-written shell should too.
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
  });

  it("uses absolute Open Graph image URLs", () => {
    for (const selector of [
      'meta[property="og:image"]',
      'meta[itemprop="thumbnailUrl"]',
      'meta[itemprop="image"]',
      'link[rel="image_src"]',
    ]) {
      const element = doc.querySelector(selector);
      const value = element.getAttribute("content") || element.getAttribute("href");
      expect(value).toMatch(/^https:\/\//);
    }
  });

  it("exposes headings to crawlers instead of hiding them", () => {
    const h1 = doc.querySelector("h1");
    expect(h1.getAttribute("style")).toBeNull();
    expect(h1.className).toBe("visually-hidden");
  });

  it("lists every company and person in the crawlable index block", () => {
    // This block is now the only place the portfolio and team exist as HTML,
    // so a missing entry is content that has left the web entirely.
    const block = html.slice(
      html.indexOf("BEGIN generated-index"),
      html.indexOf("END generated-index")
    );
    for (const [slug, company] of Object.entries(config.portfolio)) {
      expect(block).toContain(`href="${deepLink(COMMANDS.company(slug))}"`);
      expect(block).toContain(esc(company.description));
    }
    for (const [slug, person] of Object.entries(config.team)) {
      expect(block).toContain(`href="${deepLink(COMMANDS.person(slug))}"`);
      expect(block).toContain(esc(person.name));
    }
  });

  it("keeps the crawlable index reachable to text extractors", () => {
    // Not <noscript>: extraction pipelines strip it as non-content, and
    // Googlebot indexes the rendered DOM, which drops it once JS runs. Not
    // display:none either, which search engines discount. Offscreen clipping
    // survives both while staying invisible to sighted visitors.
    const block = html.slice(
      html.indexOf("BEGIN generated-index"),
      html.indexOf("END generated-index")
    );
    expect(block).not.toContain("<noscript");
    expect(block).not.toMatch(/display:\s*none/);

    const textVersion = doc.querySelector("#text-version");
    expect(textVersion).not.toBeNull();
    expect(textVersion.className).toBe("visually-hidden");
  });

  it("keeps the terminal markup untouched", () => {
    expect(doc.querySelector("#terminal")).not.toBeNull();
    expect(doc.querySelector("#aa-all")).not.toBeNull();
    expect(doc.querySelector("#files-all")).not.toBeNull();
  });
});

describe("terminal still reads from config/firm.js", () => {
  // The static mirror is only worth having if it can never disagree with the
  // terminal. These assert both read the same source.
  function loadCommands() {
    const printed = [];
    env = createBrowserEnv();
    env.window.term = {
      stylePrint: (line) => printed.push(line),
      displayURL: (url) => printed.push(url),
      openURL: (url) => printed.push(url),
      cols: 100,
    };
    env.window.colorText = (text) => text;
    env.loadScripts([
      "config/firm.js",
      "config/portfolio.js",
      "config/team.js",
      "config/jobs.js",
      "config/commands.js",
    ]);
    return { printed, ...env.exportValues(["commands", "whoisRoot"]) };
  }

  it("locate prints the address from firm.address", () => {
    const { printed, commands } = loadCommands();
    commands.locate();
    expect(printed).toContain(config.firm.address.streetAddress);
    expect(printed).toContain(
      `${config.firm.address.addressLocality}, ${config.firm.address.addressRegion} ${config.firm.address.postalCode}`
    );
  });

  it("whois root uses the same blurb the crawlable index does", () => {
    const { whoisRoot } = loadCommands();
    expect(whoisRoot.startsWith(config.firm.blurb)).toBe(true);
    expect(fileNamed("index.html")).toContain(esc(config.firm.blurb));
  });

  it("pine opens the address in firm.email", () => {
    const { printed, commands } = loadCommands();
    commands.pine();
    expect(printed).toContain(`mailto:${config.firm.email}`);
  });

  it("www points at llms.txt, not at URLs that redirect back here", () => {
    // It used to advertise /about/ and /portfolio/. Those now 301 into this
    // same terminal, so printing them would send someone in a circle.
    const { printed, commands } = loadCommands();
    commands.www();
    expect(printed).toContain(`${ORIGIN}/llms.txt`);
    for (const line of printed) {
      expect(line).not.toMatch(/root\.vc\/(about|portfolio|team|jobs)\//);
    }
  });
});
