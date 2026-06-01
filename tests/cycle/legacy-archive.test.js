import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createBrowserEnv, REPO_ROOT } from "../helpers/browser-env.js";

// Verifies the two legacy archive entries that pre-date the autonomous cycle.
// Both must be fully-vendored standalone copies that load cleanly without any
// dependency on the live repo root state — DC1 ("entire, fully functional
// copies of the website that can be viewed on their own perfectly").

const CLI_DIR = path.join(REPO_ROOT, "archive/_legacy/01-cli-terminal");
const GEO_DIR = path.join(REPO_ROOT, "archive/_legacy/02-geocities");

describe("archive/_legacy/01-cli-terminal/", () => {
  it("contains index.html, meta.json, and vendored JS/CSS/favicon", () => {
    expect(fs.existsSync(path.join(CLI_DIR, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "meta.json"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "favicon.png"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "js/app.bundle.js"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "js/xterm.js"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "js/addon-fit.js"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "js/addon-web-links.js"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "css/xterm.css"))).toBe(true);
    expect(fs.existsSync(path.join(CLI_DIR, "css/styles.css"))).toBe(true);
  });

  it("meta.json declares legacy: true with sort_order 1 (oldest)", () => {
    const meta = JSON.parse(
      fs.readFileSync(path.join(CLI_DIR, "meta.json"), "utf8")
    );
    expect(meta.legacy).toBe(true);
    expect(meta.sort_order).toBe(1);
    expect(meta.theme_name).toBe("CLI terminal");
    expect(Array.isArray(meta.theme_keys)).toBe(true);
  });

  it("index.html references vendored relative paths (not /js/, not /css/)", () => {
    const html = fs.readFileSync(path.join(CLI_DIR, "index.html"), "utf8");
    expect(html).toMatch(/href=["']\.\/css\/xterm\.css["']/);
    expect(html).toMatch(/src=["']\.\/js\/app\.bundle\.js["']/);
    expect(html).toMatch(/src=["']\.\/js\/xterm\.js["']/);
  });

  it("parses as valid HTML in JSDOM (operational integrity)", () => {
    const html = fs.readFileSync(path.join(CLI_DIR, "index.html"), "utf8");
    const env = createBrowserEnv({
      html,
      url: "https://www.root.vc/archive/_legacy/01-cli-terminal/",
    });
    expect(env.document.querySelector("#terminal")).not.toBeNull();
    expect(env.document.querySelector("title").textContent).toMatch(/Root Ventures/);
    env.cleanup();
  });
});

describe("archive/_legacy/02-geocities/", () => {
  it("contains index.html, meta.json, vendored CSS/JS/configs/favicon", () => {
    expect(fs.existsSync(path.join(GEO_DIR, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "meta.json"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "favicon.png"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "css/bootstrap.css"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "js/geo.js"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "js/comcastify.js"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "config/portfolio.js"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "config/team.js"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "config/commands.js"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "config/firm.js"))).toBe(true);
    expect(fs.existsSync(path.join(GEO_DIR, "images/logo.png"))).toBe(true);
  });

  it("includes the geo image set (banana, divider, marquee borders, etc.)", () => {
    const geoImagesDir = path.join(GEO_DIR, "images/geo");
    expect(fs.existsSync(geoImagesDir)).toBe(true);
    const files = fs.readdirSync(geoImagesDir);
    // The full geo set is ~30+ files; assert presence of the headliners.
    expect(files).toContain("banana.gif");
    expect(files).toContain("construction.gif");
    expect(files).toContain("divider.gif");
    expect(files).toContain("mchammer.gif");
    expect(files).toContain("rainbow.gif");
  });

  it("meta.json declares legacy: true with sort_order 2 (second oldest)", () => {
    const meta = JSON.parse(
      fs.readFileSync(path.join(GEO_DIR, "meta.json"), "utf8")
    );
    expect(meta.legacy).toBe(true);
    expect(meta.sort_order).toBe(2);
    expect(meta.theme_name).toBe("GeoCities skin");
    expect(meta.theme_keys).toContain("geocities");
  });

  it("index.html navigation links target safe URLs (no broken refs)", () => {
    const html = fs.readFileSync(path.join(GEO_DIR, "index.html"), "utf8");
    // < Back link goes home to root, not the broken in-archive index.html.
    expect(html).toMatch(/href=["']\/["']/);
    // Favicon was rewritten to relative path within the archive.
    expect(html).toMatch(/href=["']\.\/favicon\.png["']/);
    // Pre-game version — the PLAY ROOT ROUTER link was added post-GeoCities-era.
    expect(html).not.toMatch(/PLAY ROOT ROUTER/);
  });

  it("parses as valid HTML in JSDOM (operational integrity)", () => {
    const html = fs.readFileSync(path.join(GEO_DIR, "index.html"), "utf8");
    const env = createBrowserEnv({
      html,
      url: "https://www.root.vc/archive/_legacy/02-geocities/",
    });
    expect(env.document.querySelector("title").textContent).toMatch(/Root Ventures/);
    // Portfolio and team tables exist as empty containers; populated at runtime
    // by buildGeoPage() in geo.js (not executed in this static parse check).
    expect(env.document.querySelector("#portfolio")).not.toBeNull();
    expect(env.document.querySelector("#team")).not.toBeNull();
    env.cleanup();
  });
});

describe("legacy archive ordering", () => {
  it("sort_order across legacy entries is contiguous starting at 1", () => {
    const cli = JSON.parse(fs.readFileSync(path.join(CLI_DIR, "meta.json"), "utf8"));
    const geo = JSON.parse(fs.readFileSync(path.join(GEO_DIR, "meta.json"), "utf8"));
    expect([cli.sort_order, geo.sort_order].sort()).toEqual([1, 2]);
  });

  it("date_first_shipped is older for the CLI (sort_order 1) than GeoCities (sort_order 2)", () => {
    const cli = JSON.parse(fs.readFileSync(path.join(CLI_DIR, "meta.json"), "utf8"));
    const geo = JSON.parse(fs.readFileSync(path.join(GEO_DIR, "meta.json"), "utf8"));
    expect(new Date(cli.date_first_shipped).getTime()).toBeLessThan(
      new Date(geo.date_first_shipped).getTime()
    );
  });
});

describe("original URLs preserved at root", () => {
  it("welcome.htm still exists at repo root (existing inbound links)", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "welcome.htm"))).toBe(true);
  });

  it("game.html still exists at repo root", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "game.html"))).toBe(true);
  });

  it("index.html at repo root is the canonical current site", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "index.html"))).toBe(true);
  });
});
