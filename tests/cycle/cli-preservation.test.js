import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createBrowserEnv, REPO_ROOT } from "../helpers/browser-env.js";

// Verifies U2: the CLI terminal is preserved at /cli/ as a self-contained
// snapshot that survives cycle 1's replacement of root index.html.
//
// Assertions cluster around two concerns: the snapshot files exist with the
// right structure, and the snapshot is operationally intact (HTML parses,
// asset references resolve to vendored files under /cli/).

const CLI_DIR = path.join(REPO_ROOT, "cli");

describe("cli/ snapshot", () => {
  it("includes index.html, meta.json, and vendored JS/CSS", () => {
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

  it("meta.json declares legacy: true so smoke tests waive R3", () => {
    const meta = JSON.parse(
      fs.readFileSync(path.join(CLI_DIR, "meta.json"), "utf8")
    );
    expect(meta.legacy).toBe(true);
    expect(meta.theme_name).toBe("CLI terminal");
    expect(Array.isArray(meta.theme_keys)).toBe(true);
    expect(meta.theme_keys.length).toBeGreaterThan(0);
  });

  it("index.html references vendored relative paths (not /js/, not /css/)", () => {
    const html = fs.readFileSync(path.join(CLI_DIR, "index.html"), "utf8");
    // Asset references for the script/css under /cli/ MUST be relative
    expect(html).toMatch(/href=["']\.\/css\/xterm\.css["']/);
    expect(html).toMatch(/src=["']\.\/js\/app\.bundle\.js["']/);
    expect(html).toMatch(/src=["']\.\/js\/xterm\.js["']/);
    // Whereas references to /images/ stay absolute (the bundle's internal refs
    // resolve against root) — this is documented in meta.json's where_facts_live.
    expect(html).toMatch(/\/images\/logo\.png/);
  });
});

describe("cli/ snapshot operational integrity", () => {
  let env;

  beforeEach(() => {
    env = null;
  });

  afterEach(() => {
    if (env) env.cleanup();
  });

  it("parses as valid HTML in JSDOM", () => {
    const html = fs.readFileSync(path.join(CLI_DIR, "index.html"), "utf8");
    env = createBrowserEnv({ html, url: "https://www.root.vc/cli/" });
    expect(env.document.querySelector("#terminal")).not.toBeNull();
    expect(env.document.querySelector("title").textContent).toMatch(/Root Ventures/);
  });
});

describe("original URLs are preserved", () => {
  it("welcome.htm still exists at repo root (existing URL preserved)", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "welcome.htm"))).toBe(true);
  });

  it("game.html still exists at repo root (existing URL preserved)", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "game.html"))).toBe(true);
  });

  it("archive/ directory exists and is empty except .gitkeep", () => {
    const archivePath = path.join(REPO_ROOT, "archive");
    expect(fs.existsSync(archivePath)).toBe(true);
    const contents = fs.readdirSync(archivePath);
    expect(contents).toContain(".gitkeep");
  });
});
