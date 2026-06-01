import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createBrowserEnv, REPO_ROOT } from "../helpers/browser-env.js";

// Verifies the U1-added config layer. Facts (firm.js) are loaded into the JSDOM
// runtime just like portfolio.js / team.js — that's how the existing CLI sees
// them. Prose configs (brand-brief.md, no-fly-list.md, topical-rubric.md) are
// asserted as readable, non-empty, and structurally well-formed for the cycle's
// downstream consumption.

describe("config/firm.js", () => {
  it("exposes a top-level `firm` global with anchor facts", () => {
    const env = createBrowserEnv();
    env.loadScripts(["config/firm.js"]);
    const { firm } = env.exportValues(["firm"]);

    expect(firm).toBeDefined();
    expect(typeof firm.name).toBe("string");
    expect(firm.name.length).toBeGreaterThan(0);
    expect(typeof firm.tagline).toBe("string");
    expect(typeof firm.mission).toBe("string");
    expect(typeof firm.address).toBe("string");
    expect(firm.contact).toBeDefined();
    expect(typeof firm.contact.primary).toBe("string");
    expect(firm.contact.primary).toMatch(/@/);

    env.cleanup();
  });

  it("is importable as a Node module (for the cycle orchestrator)", () => {
    const filePath = path.join(REPO_ROOT, "config/firm.js");
    const firm = require(filePath);

    expect(firm.name).toBeDefined();
    expect(firm.social).toBeDefined();
    expect(Array.isArray(firm.sectorFocus)).toBe(true);
  });
});

describe("brand-brief.md", () => {
  const filePath = path.join(REPO_ROOT, "config/brand-brief.md");

  it("exists and is non-empty", () => {
    const contents = fs.readFileSync(filePath, "utf8");
    expect(contents.length).toBeGreaterThan(100);
  });

  it("contains the structural sections the cycle expects", () => {
    const contents = fs.readFileSync(filePath, "utf8").toLowerCase();
    expect(contents).toMatch(/voice/);
    expect(contents).toMatch(/tone/);
    expect(contents).toMatch(/do(n'?t)?:/);
  });
});

describe("no-fly-list.md", () => {
  const filePath = path.join(REPO_ROOT, "config/no-fly-list.md");

  it("exists and is non-empty", () => {
    const contents = fs.readFileSync(filePath, "utf8");
    expect(contents.length).toBeGreaterThan(100);
  });

  it("declares topics, framings, and aesthetics sections", () => {
    const contents = fs.readFileSync(filePath, "utf8").toLowerCase();
    expect(contents).toMatch(/topics?/);
    expect(contents).toMatch(/framings?/);
    expect(contents).toMatch(/aesthetics?/);
  });
});

describe("topical-rubric.md", () => {
  const filePath = path.join(REPO_ROOT, "config/topical-rubric.md");

  it("exists and declares four tiers", () => {
    const contents = fs.readFileSync(filePath, "utf8");
    expect(contents.length).toBeGreaterThan(100);
    // The rubric lives or dies by the four-tier structure; check all are named.
    expect(contents.toLowerCase()).toMatch(/tier 1/);
    expect(contents.toLowerCase()).toMatch(/tier 2/);
    expect(contents.toLowerCase()).toMatch(/tier 3/);
    expect(contents.toLowerCase()).toMatch(/tier 4/);
  });
});

describe("weekly-hook.txt", () => {
  const filePath = path.join(REPO_ROOT, "config/weekly-hook.txt");

  it("exists (may be empty)", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.isFile()).toBe(true);
  });
});

describe(".github/CODEOWNERS", () => {
  const filePath = path.join(REPO_ROOT, ".github/CODEOWNERS");

  it("gates the brand-safety configs (DC17)", () => {
    const contents = fs.readFileSync(filePath, "utf8");
    expect(contents).toMatch(/config\/brand-brief\.md/);
    expect(contents).toMatch(/config\/no-fly-list\.md/);
    expect(contents).toMatch(/config\/topical-rubric\.md/);
  });
});
