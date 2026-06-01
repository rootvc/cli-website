import { afterEach, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import fs from "node:fs";
import {
  loadArtifactDom,
  readArtifactMeta,
  resolveArtifactPath,
} from "../helpers/artifact-env.js";
import { REPO_ROOT } from "../helpers/browser-env.js";

// DC6: 90% portfolio coverage + Editor-approved rationale for omissions.
// Firm name + mission + contact link stay at 100%. Skipped when meta.legacy is
// true (CLI snapshot, etc.) — legacy entries pre-date the system and aren't
// held to current requirements (DC1).
//
// Driven by ARTIFACT_PATH env var. Without it, the entire suite skips so
// ordinary CI runs are clean.

const ARTIFACT_PATH = resolveArtifactPath(process.env.ARTIFACT_PATH);
const ARTIFACT_META = ARTIFACT_PATH ? readArtifactMeta(ARTIFACT_PATH) : null;
const IS_LEGACY = ARTIFACT_META && ARTIFACT_META.legacy === true;
const PORTFOLIO_COVERAGE_THRESHOLD = 0.9;

// DC1 waives R3 entirely for legacy entries (existing artifacts that predate
// the system). The CLI snapshot at /cli/ surfaces facts via runtime command
// output rather than static DOM text, so legacy waiver applies to every check
// in this file uniformly.

describe.skipIf(!ARTIFACT_PATH || IS_LEGACY)("anchor facts", () => {
  let env;

  beforeEach(() => {
    env = null;
  });

  afterEach(() => {
    if (env) env.cleanup();
  });

  it(
    "renders at least 90% of portfolio companies by name or url",
    () => {
      // config/portfolio.js doesn't have module.exports (existing CLI pattern
      // — assigns to a top-level const that becomes a window global). Use the
      // vm-based loader to read the value.
      const portfolio = loadConfigGlobal("portfolio", "config/portfolio.js");
      env = loadArtifactDom(ARTIFACT_PATH);
      const haystack = collectSearchableText(env.document);

      const companies = Object.entries(portfolio).map(([key, val]) => ({
        key,
        name: val.name || key,
        url: val.url,
      }));
      const missing = companies.filter(
        (c) =>
          !haystack.includes(c.name) &&
          !haystack.includes(c.key) &&
          (!c.url || !haystack.includes(c.url))
      );
      const coverage = (companies.length - missing.length) / companies.length;

      expect(
        coverage,
        `Portfolio coverage ${(coverage * 100).toFixed(1)}% < ${PORTFOLIO_COVERAGE_THRESHOLD * 100}%. ` +
          `Missing: ${missing.map((m) => m.name).join(", ")}. ` +
          `If intentional, document in meta.editorial_note.`
      ).toBeGreaterThanOrEqual(PORTFOLIO_COVERAGE_THRESHOLD);
    }
  );

  it(
    "renders 100% of team members by name",
    () => {
      const team = loadConfigGlobal("team", "config/team.js");
      env = loadArtifactDom(ARTIFACT_PATH);
      const haystack = collectSearchableText(env.document);

      const missing = Object.entries(team)
        .map(([key, val]) => ({ key, name: val.name || key }))
        .filter((m) => !haystack.includes(m.name) && !haystack.includes(m.key));

      expect(
        missing,
        `Team members missing from artifact: ${missing.map((m) => m.name).join(", ")}`
      ).toHaveLength(0);
    }
  );

  it("renders firm name and mission", () => {
    const firm = require(path.join(REPO_ROOT, "config/firm.js"));
    env = loadArtifactDom(ARTIFACT_PATH);
    const haystack = collectSearchableText(env.document);

    expect(haystack, "firm name must appear in artifact").toContain(firm.name);
    // Mission can appear via tagline OR mission OR thesis — accept any.
    const missionPresent =
      haystack.includes(firm.tagline) ||
      haystack.includes(firm.mission) ||
      haystack.includes(firm.thesis);
    expect(
      missionPresent,
      "at least one of firm.tagline / firm.mission / firm.thesis must appear"
    ).toBe(true);
  });

  it("exposes a working contact path", () => {
    const firm = require(path.join(REPO_ROOT, "config/firm.js"));
    env = loadArtifactDom(ARTIFACT_PATH);

    const mailtos = Array.from(
      env.document.querySelectorAll('a[href^="mailto:"]')
    ).map((a) => a.getAttribute("href"));
    const haystack = collectSearchableText(env.document);

    const contactPresent =
      mailtos.some((m) => m.includes(firm.contact.primary)) ||
      haystack.includes(firm.contact.primary);
    expect(
      contactPresent,
      `contact path ${firm.contact.primary} must appear (mailto link or visible text)`
    ).toBe(true);
  });
});

// Helper: read a config file that defines a top-level `const foo = {...}` and
// return the exported object. We can't `require()` the existing CLI configs
// because they don't use module.exports — they assign to a top-level const that
// becomes a window global. Load via JSDOM eval instead.
function loadConfigGlobal(name, relativePath) {
  const fullPath = path.join(REPO_ROOT, relativePath);
  const source = fs.readFileSync(fullPath, "utf8");
  // Append an export so we can read it.
  const wrapped = `${source}\nmodule.exports = ${name};`;
  // Use require with a temporary path approach via vm.
  const vm = require("node:vm");
  const sandbox = { module: { exports: {} }, console };
  sandbox.global = sandbox;
  vm.runInNewContext(wrapped, sandbox);
  return sandbox.module.exports;
}

function collectSearchableText(document) {
  const text = document.body.textContent || "";
  const attributeText = Array.from(document.querySelectorAll("*"))
    .flatMap((el) => {
      const attrs = [];
      for (const a of ["href", "alt", "title", "aria-label", "data-name", "data-title"]) {
        const v = el.getAttribute(a);
        if (v) attrs.push(v);
      }
      return attrs;
    })
    .join(" ");
  return `${text}\n${attributeText}`;
}
