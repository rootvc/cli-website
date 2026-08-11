import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { createBrowserEnv, REPO_ROOT } from "./helpers/browser-env";
import buildPagesModule from "../scripts/build-pages.js";
import buildAssetsModule from "../scripts/build-assets.js";

const {
  AI_CRAWLERS,
  ORIGIN,
  buildPages,
  esc,
  findDrift,
  loadConfig,
  metaDescription,
  renderCompany,
  renderPerson,
} = buildPagesModule;

const config = loadConfig();
const files = buildPages(config);

const htmlPages = files.filter((file) => file.path.endsWith(".html"));
// index.html is the terminal; it is only partially generated, so the per-page
// invariants below (single h1, canonical, prompt line) do not apply to it.
const mirrorPages = htmlPages.filter((file) => file.path !== "index.html");

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
  // loaded via raw <script src> tags in welcome.htm. Adding ESM or CJS exports
  // breaks the build or throws at runtime in the browser — build-pages.js reads
  // them in a vm sandbox precisely so they never have to change.
  const configFiles = fs
    .readdirSync(path.join(REPO_ROOT, "config"))
    .filter((name) => name.endsWith(".js"));

  it.each(configFiles)("%s has no module syntax", (name) => {
    const source = fs.readFileSync(path.join(REPO_ROOT, "config", name), "utf8");
    expect(source).not.toMatch(/^\s*(export|import)\s/m);
    expect(source).not.toMatch(/\bmodule\.exports\b/);
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

describe("page invariants", () => {
  it.each(mirrorPages.map((file) => file.path))("%s is well formed", (filePath) => {
    const page = mirrorPages.find((file) => file.path === filePath);
    const doc = parse(page.content);

    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelector("h1").textContent.trim()).not.toBe("");
    expect(doc.querySelector("meta[charset]")).not.toBeNull();
    expect(doc.documentElement.getAttribute("lang")).toBe("en");

    const description = doc.querySelector('meta[name="description"]');
    expect(description).not.toBeNull();
    expect(description.content.length).toBeGreaterThan(0);
    expect(description.content.length).toBeLessThanOrEqual(160);

    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical.href).toBe(`${ORIGIN}${pathnameFor(filePath)}`);
    expect(canonical.href.endsWith("/")).toBe(true);

    // og:url and canonical must agree, or they fight each other.
    expect(doc.querySelector('meta[property="og:url"]').content).toBe(
      canonical.href
    );
    // Open Graph silently drops relative image paths.
    expect(
      doc.querySelector('meta[property="og:image"]').content
    ).toMatch(/^https:\/\//);

    // The font stylesheet must be preconnected, not pulled in via CSS @import
    // — an @import can't start downloading until pages.css itself has been
    // fetched and parsed, serializing two round trips that could be parallel.
    const preconnects = [...doc.querySelectorAll('link[rel="preconnect"]')].map(
      (link) => link.href
    );
    expect(preconnects).toContain("https://fonts.googleapis.com/");
    expect(preconnects).toContain("https://fonts.gstatic.com/");
    expect(
      doc.querySelector('link[rel="stylesheet"][href*="fonts.googleapis.com"]')
    ).not.toBeNull();
  });

  it("titles are unique across the mirror", () => {
    const titles = mirrorPages.map(
      (file) => parse(file.content).querySelector("title").textContent
    );
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("every portfolio and team entry gets a page", () => {
    for (const slug of Object.keys(config.portfolio)) {
      expect(files.some((f) => f.path === `portfolio/${slug}/index.html`)).toBe(true);
    }
    for (const slug of Object.keys(config.team)) {
      expect(files.some((f) => f.path === `team/${slug}/index.html`)).toBe(true);
    }
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

  it("escapes hostile data in HTML and JSON-LD", () => {
    const page = renderCompany(
      { firm: config.firm, portfolio: { evil: hostile, other: hostile } },
      "evil",
      0
    );

    expect(page.content).not.toContain("<script>alert(1)</script>");
    expect(page.content).not.toContain("<img src=x onerror");
    expect(page.content).toContain("&amp;");

    // Exactly one real <script> — the JSON-LD block. Anything else means the
    // payload broke out of an attribute or text node.
    const scripts = parse(page.content).querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].type).toBe("application/ld+json");
  });

  it("keeps </script> from terminating the JSON-LD block", () => {
    const page = renderCompany(
      { firm: config.firm, portfolio: { evil: hostile, other: hostile } },
      "evil",
      0
    );
    const script = parse(page.content).querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script.textContent).not.toContain("</script");
    expect(() => JSON.parse(script.textContent)).not.toThrow();
  });

  it("esc handles the five HTML-significant characters", () => {
    expect(esc(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});

describe("metaDescription", () => {
  it("passes short text through unchanged", () => {
    expect(metaDescription("Short and sweet.")).toBe("Short and sweet.");
  });

  it("truncates on a word boundary within the limit", () => {
    // Asserting the exact string, not just "no trailing space before …", so a
    // regression to a mid-word cut can't slip through by accident.
    const result = metaDescription("alpha beta gamma delta epsilon", 20);
    expect(result).toBe("alpha beta gamma…");
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("falls back to a mid-word cut when no reasonable word boundary exists", () => {
    // The nearest space is beyond a quarter of the budget away (there is no
    // space at all here), so honoring it would throw away almost everything.
    const result = metaDescription("Supercalifragilisticexpialidocious is a fake word", 10);
    expect(result).toBe("Supercali…");
    expect(result.length).toBe(10);
  });

  it("honors a word boundary at limits well below the 160 default", () => {
    // The 25%-of-limit threshold must scale with `limit`, not stay pinned to
    // the hardcoded value that only made sense for limit=160.
    const result = metaDescription("hello there friend", 12);
    expect(result).toBe("hello…");
  });

  it("collapses whitespace", () => {
    expect(metaDescription("a  \n  b")).toBe("a b");
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

  it("models investment from the company, not the fund", () => {
    const slug = Object.keys(config.portfolio)[0];
    const doc = parse(fileNamed(`portfolio/${slug}/index.html`));
    const graph = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]').textContent
    )["@graph"];
    const company = graph.find((node) => node["@id"].endsWith("#company"));
    expect(company["@type"]).toBe("Organization");
    expect(company.funder["@id"]).toBe(`${ORIGIN}/#organization`);
  });

  it("uses ProfilePage and Person for team members", () => {
    const slug = Object.keys(config.team)[0];
    const doc = parse(fileNamed(`team/${slug}/index.html`));
    const graph = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]').textContent
    )["@graph"];
    expect(graph.some((node) => node["@type"] === "ProfilePage")).toBe(true);
    const person = graph.find((node) => node["@type"] === "Person");
    expect(person.name).toBe(config.team[slug].name);
    expect(person.jobTitle).toBe(config.team[slug].title);
    expect(person.worksFor["@id"]).toBe(`${ORIGIN}/#organization`);
  });
});

describe("findDrift (the --check drift guard)", () => {
  // This is the function CI relies on to fail a build when config/*.js was
  // edited without regenerating the committed output. It must actually be
  // able to say "in sync" and "out of sync" correctly, or a non-deterministic
  // buildPages() (object-key order, a stray timestamp) would pass CI silently
  // forever. findDrift is pure — no console output, no process.exit — so it
  // is exercised directly here rather than through the CLI.
  it("reports no drift when generated content matches what is on disk", () => {
    // Use the actual current build output for a real emitted file: it was
    // written by `npm run build` in this checkout, so it must match.
    const [target] = files.filter((f) => f.path === "about/index.html");
    const { drifted } = findDrift([target]);
    expect(drifted).toEqual([]);
  });

  it("flags a file whose disk content no longer matches the generator", () => {
    const [target] = files.filter((f) => f.path === "about/index.html");
    const mutated = { ...target, content: `${target.content}\n<!-- stale -->` };
    const { drifted } = findDrift([mutated]);
    expect(drifted).toEqual(["about/index.html"]);
  });

  it("flags a generated file that does not exist on disk yet", () => {
    const { drifted } = findDrift([
      { path: "portfolio/does-not-exist/index.html", content: "<html></html>" },
    ]);
    expect(drifted).toEqual(["portfolio/does-not-exist/index.html (missing)"]);
  });

  it("the full current build reports zero drift", () => {
    // End-to-end sanity check: regenerating everything in memory right now
    // must match what is committed, mirroring what `npm run build:pages:check`
    // asserts in CI.
    const { drifted } = findDrift();
    expect(drifted).toEqual([]);
  });
});

describe("search invisibility", () => {
  // root.vc is meant to be the only result Google shows — the terminal is the
  // front door and sitelinks to /about/, /team/ give away the trick. But the
  // mirror still has to be readable by AI crawlers, so this is done with
  // `noindex` (a search-indexing directive crawlers may still read past) and
  // NOT with a robots.txt Disallow (which would hide it from them too).

  it.each(mirrorPages.map((file) => file.path))("%s is noindex", (filePath) => {
    const page = mirrorPages.find((file) => file.path === filePath);
    const robots = parse(page.content).querySelector('meta[name="robots"]');
    expect(robots).not.toBeNull();
    expect(robots.content).toMatch(/\bnoindex\b/);
    // `follow` keeps link equity flowing back to the homepage.
    expect(robots.content).toMatch(/\bfollow\b/);
  });

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

  it("does not use robots.txt to hide the mirror from AI crawlers", () => {
    // A Disallow here would block GPTBot/ClaudeBot/PerplexityBot from ever
    // fetching the content, defeating the reason the mirror exists.
    const robots = fileNamed("robots.txt");
    for (const dir of ["/portfolio/", "/team/", "/about/", "/jobs/"]) {
      expect(robots).not.toContain(`Disallow: ${dir}`);
    }
    expect(robots).not.toContain("Disallow: /llms");
  });

  it("still exposes the full mirror to LLM crawlers", () => {
    // llms.txt and the homepage <noscript> remain the discovery paths.
    const llms = fileNamed("llms.txt");
    for (const [slug, company] of Object.entries(config.portfolio)) {
      expect(llms).toContain(`${ORIGIN}/portfolio/${slug}/`);
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
    // root.vc should be the only Google result. Listing a noindex page in the
    // sitemap asks Google to index something the page forbids, and that
    // contradiction is what generates sitelinks to /about/, /team/, etc.
    expect(locs).toEqual([`${ORIGIN}/`]);
  });

  it("excludes every mirror page", () => {
    for (const file of mirrorPages) {
      expect(locs).not.toContain(`${ORIGIN}${pathnameFor(file.path)}`);
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

  it("links every company and person", () => {
    for (const [slug, company] of Object.entries(config.portfolio)) {
      expect(llms).toContain(`[${company.name}](${ORIGIN}/portfolio/${slug}/)`);
    }
    for (const [slug, person] of Object.entries(config.team)) {
      expect(llms).toContain(`[${person.name}](${ORIGIN}/team/${slug}/)`);
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
  it("every internal href resolves to something we emit or ship", () => {
    const emitted = new Set(mirrorPages.map((file) => pathnameFor(file.path)));
    emitted.add("/");
    emitted.add("/welcome.htm");

    const broken = [];
    for (const page of htmlPages) {
      const doc = parse(page.content);
      for (const anchor of doc.querySelectorAll("a[href^='/']")) {
        const href = anchor.getAttribute("href");
        if (emitted.has(href)) continue;
        // Static assets are served from disk rather than generated.
        if (fs.existsSync(path.join(REPO_ROOT, href.replace(/^\//, "")))) continue;
        broken.push(`${page.path} -> ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("stylesheet and JSON-LD image references exist on disk", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "css/pages.css"))).toBe(true);
    for (const slug of Object.keys(config.portfolio)) {
      expect(fs.existsSync(path.join(REPO_ROOT, `images/${slug}.jpg`))).toBe(true);
    }
    for (const slug of Object.keys(config.team)) {
      expect(fs.existsSync(path.join(REPO_ROOT, `images/${slug}.png`))).toBe(true);
    }
  });

  it("never emits the (inactive) URL sentinel as a link", () => {
    // config/portfolio.js can carry url: "(inactive)" (see js/geo.js).
    const withSentinel = {
      firm: config.firm,
      portfolio: {
        gone: { name: "Gone", url: "(inactive)", description: "No longer with us." },
        other: { name: "Other", url: "https://example.com", description: "Fine." },
      },
    };
    const page = renderCompany(withSentinel, "gone", 0);
    expect(page.content).not.toContain("(inactive)");
    expect(page.content).not.toContain('href=""');
  });

  it("never turns a non-http(s) scheme in config data into a live href", () => {
    // config/*.js is only editable by whoever can already edit the terminal's
    // own code, so this isn't defending against an outside attacker — it's a
    // guard against a bad value (a stray "javascript:" paste, a malformed
    // entry) turning into unsafe or broken markup instead of being dropped.
    const hostile = {
      firm: config.firm,
      portfolio: {
        evil: {
          name: "Evil Corp",
          url: "javascript:alert(1)",
          demo: "data:text/html,<script>alert(1)</script>",
          description: "Not a real company.",
        },
        other: { name: "Other", url: "https://example.com", description: "Fine." },
      },
    };
    const page = renderCompany(hostile, "evil", 0);
    expect(page.content).not.toContain("javascript:");
    expect(page.content).not.toContain("data:text/html");

    const graph = JSON.parse(
      parse(page.content).querySelector('script[type="application/ld+json"]')
        .textContent
    )["@graph"];
    const company = graph.find((node) => node["@id"].endsWith("#company"));
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

  it("lists every company and person in the noscript block", () => {
    const noscript = html.slice(
      html.indexOf("BEGIN generated-index"),
      html.indexOf("END generated-index")
    );
    for (const slug of Object.keys(config.portfolio)) {
      expect(noscript).toContain(`href="/portfolio/${slug}/"`);
    }
    for (const slug of Object.keys(config.team)) {
      expect(noscript).toContain(`href="/team/${slug}/"`);
    }
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

  it("whois root uses the same blurb the static pages do", () => {
    const { whoisRoot } = loadCommands();
    expect(whoisRoot.startsWith(config.firm.blurb)).toBe(true);
    expect(fileNamed("about/index.html")).toContain(esc(config.firm.blurb));
  });

  it("pine opens the address in firm.email", () => {
    const { printed, commands } = loadCommands();
    commands.pine();
    expect(printed).toContain(`mailto:${config.firm.email}`);
  });

  it("www points at the static mirror", () => {
    const { printed, commands } = loadCommands();
    commands.www();
    expect(printed).toContain(`${ORIGIN}/portfolio/`);
    expect(printed).toContain(`${ORIGIN}/team/`);
  });
});
