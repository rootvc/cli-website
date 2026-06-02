import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

// CommonJS interop — the orchestrator and its deps are CJS, matching the
// rest of scripts/cycle/. Vitest handles the bridge.
const require = (await import("node:module")).createRequire(import.meta.url);
const orchestrator = require("../../scripts/cycle/run-cycle.js");
const { validate: validateAuthorOutput } = require("../../scripts/cycle/output-schema.js");
const performanceLog = require("../../scripts/cycle/performance-log.js");
const freezeArchive = require("../../scripts/cycle/freeze-archive.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ============================================================================
// Helpers — fixtures, temp dir management, stub callables.
// ============================================================================

function makeTempDir(prefix = "orchestrator-test-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmTempDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// A minimal valid Author output. Tests clone-and-mutate this for variants.
function validAuthorOutput(overrides = {}) {
  const base = {
    site: {
      files: {
        "index.html": [
          "<!doctype html>",
          '<html lang="en">',
          "<head>",
          "  <meta charset=\"utf-8\">",
          "  <title>Root Ventures — test drop</title>",
          '  <meta name="csp-nonce" content="{{CSP_NONCE}}">',
          "</head>",
          "<body>",
          "  <h1>Root Ventures</h1>",
          "  <p>Seeding bold engineers.</p>",
          "  <a href=\"mailto:hello@root.vc\">hello@root.vc</a>",
          "  <a href=\"/archive/2026-05-25/\">View past drops</a>",
          '  <script nonce="{{CSP_NONCE}}">console.log("hi");</script>',
          "</body>",
          "</html>",
        ].join("\n"),
        "style.css": "body { font-family: monospace; }",
      },
    },
    meta: {
      theme_name: "test-drop",
      editorial_note:
        "A test drop produced by the orchestrator test fixture. Not a real artifact.",
      where_facts_live: {
        firm_name: "in <h1>",
        mission: "in <p>",
        portfolio: "n/a for fixture",
        team: "n/a for fixture",
        contact: "mailto link in body",
      },
      history_view_concept: "A 'View past drops' link in the body.",
      theme_keys: ["test", "minimal"],
      topical: false,
      csp_nonce: "{{CSP_NONCE}}",
    },
    social: {
      tweet_draft: "Test drop ships.",
      tweet_thread: [],
      linkedin_draft: "Test LinkedIn copy for the orchestrator test fixture.",
      screenshot_brief: "Screenshot the whole page; the layout is the joke.",
    },
  };
  return deepMerge(base, overrides);
}

function deepMerge(a, b) {
  if (!b) return a;
  const out = Array.isArray(a) ? [...a] : { ...a };
  for (const k of Object.keys(b)) {
    if (
      b[k] &&
      typeof b[k] === "object" &&
      !Array.isArray(b[k]) &&
      a[k] &&
      typeof a[k] === "object"
    ) {
      out[k] = deepMerge(a[k], b[k]);
    } else {
      out[k] = b[k];
    }
  }
  return out;
}

function fakeConfigs() {
  return {
    firm: { name: "Root Ventures", mission: "test", contact: { primary: "hello@root.vc" } },
    portfolio: {},
    team: {},
    jobs: {},
    brandBrief: "stub",
    noFlyList: "stub",
    topicalRubric: "stub",
    dailyHook: null,
  };
}

function alwaysPassSmoke() {
  return { passed: true, failures: [] };
}

function alwaysApproveEditor() {
  return {
    decision: "approve",
    critique: "looks great",
    sensitivity_check: "non_topical",
  };
}

function fixedNonce() {
  return "test-nonce-abc-12345678";
}

// ============================================================================
// Schema validation — sanity check our fixture passes.
// ============================================================================

describe("output-schema validate()", () => {
  it("accepts the valid fixture", () => {
    const result = validateAuthorOutput(validAuthorOutput());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects when site.files.index.html is missing", () => {
    const bad = validAuthorOutput();
    delete bad.site.files["index.html"];
    const result = validateAuthorOutput(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/index\.html|required/);
  });

  it("rejects when meta.theme_keys is empty", () => {
    const bad = validAuthorOutput({ meta: { theme_keys: [] } });
    const result = validateAuthorOutput(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/theme_keys|minItems/);
  });

  it("rejects when topical:true but topical_hook is missing", () => {
    const bad = validAuthorOutput({ meta: { topical: true } });
    const result = validateAuthorOutput(bad);
    expect(result.valid).toBe(false);
  });

  it("rejects tweet drafts over 280 chars", () => {
    const bad = validAuthorOutput({
      social: { tweet_draft: "x".repeat(300) },
    });
    const result = validateAuthorOutput(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tweet_draft|maxLength/);
  });
});

// ============================================================================
// Performance log assembly
// ============================================================================

describe("performance-log assemble()", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("perf-log-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  function writeEntry(date, { meta, rating, engagement, editorNotes, dirOverride } = {}) {
    const dir = dirOverride || path.join(tmp, date);
    fs.mkdirSync(dir, { recursive: true });
    if (meta !== undefined) {
      fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
    }
    if (rating !== undefined) {
      fs.writeFileSync(path.join(dir, "rating.json"), JSON.stringify(rating));
    }
    if (engagement !== undefined) {
      fs.writeFileSync(path.join(dir, "engagement.json"), JSON.stringify(engagement));
    }
    if (editorNotes !== undefined) {
      fs.writeFileSync(path.join(dir, "editor_notes.md"), editorNotes);
    }
  }

  it("returns the last 12 entries, sorted descending by date", () => {
    // Write 15 entries — should keep only the most-recent 12.
    for (let i = 0; i < 15; i++) {
      const day = String(i + 1).padStart(2, "0");
      writeEntry(`2026-01-${day}`, {
        meta: { theme_name: `drop-${i}`, theme_keys: [`key-${i}`], topical: false },
      });
    }
    const log = performanceLog.assemble(tmp);
    expect(log).toHaveLength(12);
    expect(log[0].date).toBe("2026-01-15");
    expect(log[11].date).toBe("2026-01-04");
  });

  it("returns null (not 0) for absent ratings", () => {
    writeEntry("2026-01-01", {
      meta: { theme_name: "no-ratings", theme_keys: ["a"], topical: false },
      // rating intentionally omitted
    });
    const log = performanceLog.assemble(tmp);
    expect(log).toHaveLength(1);
    expect(log[0].ratings).toBeNull();
  });

  it("preserves empty array as 'rated but no ratings' signal", () => {
    writeEntry("2026-01-01", {
      meta: { theme_name: "empty-ratings", theme_keys: ["a"], topical: false },
      rating: [],
    });
    const log = performanceLog.assemble(tmp);
    expect(log[0].ratings).toEqual([]);
  });

  it("excludes _legacy/ entries from the main log when generated drops exist", () => {
    writeEntry("2026-01-01", {
      meta: { theme_name: "drop-1", theme_keys: ["a"], topical: false },
    });
    writeEntry("legacy-cli", {
      dirOverride: path.join(tmp, "_legacy", "cli-terminal"),
      meta: { theme_name: "CLI terminal", theme_keys: ["cli"], legacy: true },
    });
    const log = performanceLog.assemble(tmp);
    expect(log).toHaveLength(1);
    expect(log[0].date).toBe("2026-01-01");
  });

  it("seeds from _legacy/ entries when no generated drops exist (cycle 1)", () => {
    writeEntry("legacy-cli", {
      dirOverride: path.join(tmp, "_legacy", "cli-terminal"),
      meta: {
        theme_name: "CLI terminal",
        theme_keys: ["cli", "terminal"],
        legacy: true,
      },
    });
    writeEntry("legacy-geo", {
      dirOverride: path.join(tmp, "_legacy", "geocities"),
      meta: {
        theme_name: "GeoCities",
        theme_keys: ["geocities", "retro"],
        legacy: true,
      },
    });
    const log = performanceLog.assemble(tmp);
    expect(log.length).toBeGreaterThan(0);
    expect(log.every((e) => e.legacy === true)).toBe(true);
    const allThemeKeys = log.flatMap((e) => e.meta.theme_keys);
    expect(allThemeKeys).toContain("cli");
    expect(allThemeKeys).toContain("geocities");
  });

  it("returns [] when the archive root does not exist", () => {
    const log = performanceLog.assemble(path.join(tmp, "does-not-exist"));
    expect(log).toEqual([]);
  });

  it("handles malformed meta.json gracefully (skips the entry)", () => {
    writeEntry("2026-01-01", {
      meta: { theme_name: "good", theme_keys: ["a"], topical: false },
    });
    // Write a bad entry — invalid JSON in meta.json
    const badDir = path.join(tmp, "2026-01-02");
    fs.mkdirSync(badDir, { recursive: true });
    fs.writeFileSync(path.join(badDir, "meta.json"), "{ not valid json");
    const log = performanceLog.assemble(tmp);
    // The bad entry is skipped; the good one is included.
    expect(log.map((e) => e.date)).toContain("2026-01-01");
  });
});

// ============================================================================
// Revision loop — happy path
// ============================================================================

describe("orchestrator revision loop — happy path", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("loop-happy-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  it("approves a valid Author output, writes archive, returns success", async () => {
    const authorOutput = validAuthorOutput();
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null },
      maxRetries: 3,
      authorCall: async () => authorOutput,
      editorCall: async () => alwaysApproveEditor(),
      smokeGateFn: () => alwaysPassSmoke(),
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });
    expect(result.success).toBe(true);
    expect(result.retriesUsed).toBe(0);
    expect(result.authorOutput.meta.csp_nonce).toBe(fixedNonce());

    // Verify the freeze actually wrote files.
    expect(fs.existsSync(path.join(tmp, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tmp, "meta.json"))).toBe(true);
    expect(fs.existsSync(path.join(tmp, "social.json"))).toBe(true);
    expect(fs.existsSync(path.join(tmp, "rating.json"))).toBe(true);
    expect(fs.existsSync(path.join(tmp, "engagement.json"))).toBe(true);

    // The nonce placeholder should have been replaced in index.html.
    const html = fs.readFileSync(path.join(tmp, "index.html"), "utf8");
    expect(html).toContain(fixedNonce());
    expect(html).not.toContain("{{CSP_NONCE}}");
  });
});

// ============================================================================
// Revision loop — schema validation failure
// ============================================================================

describe("orchestrator revision loop — schema failure", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("loop-schema-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  it("retries on schema-invalid output, passes error details as critique", async () => {
    let attempts = 0;
    const seenCritiques = [];
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null },
      maxRetries: 3,
      authorCall: async ({ priorCritique }) => {
        seenCritiques.push(priorCritique);
        attempts++;
        if (attempts === 1) {
          // First attempt: emit schema-invalid output (missing index.html).
          const bad = validAuthorOutput();
          delete bad.site.files["index.html"];
          return bad;
        }
        // Subsequent attempts: emit valid output.
        return validAuthorOutput();
      },
      editorCall: async () => alwaysApproveEditor(),
      smokeGateFn: () => alwaysPassSmoke(),
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });

    expect(result.success).toBe(true);
    expect(result.retriesUsed).toBe(1);
    // First attempt had no prior critique.
    expect(seenCritiques[0]).toBeNull();
    // Second attempt's critique should be a schema-error message.
    expect(seenCritiques[1]).toMatch(/schema/i);
    expect(seenCritiques[1]).toMatch(/index\.html|required/i);
  });
});

// ============================================================================
// Revision loop — editor rejection
// ============================================================================

describe("orchestrator revision loop — editor reject", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("loop-editor-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  it("retries on editor reject, threads the critique into the next attempt", async () => {
    let attempts = 0;
    const seenCritiques = [];
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null },
      maxRetries: 3,
      authorCall: async ({ priorCritique }) => {
        seenCritiques.push(priorCritique);
        attempts++;
        return validAuthorOutput();
      },
      editorCall: async () => {
        if (attempts === 1) {
          return {
            decision: "reject",
            critique:
              "the editorial note reads as boilerplate; name the conceit specifically",
            sensitivity_check: "non_topical",
          };
        }
        return alwaysApproveEditor();
      },
      smokeGateFn: () => alwaysPassSmoke(),
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });

    expect(result.success).toBe(true);
    expect(result.retriesUsed).toBe(1);
    expect(seenCritiques[1]).toMatch(/Editor rejected/);
    expect(seenCritiques[1]).toMatch(/editorial note reads as boilerplate/);
  });
});

// ============================================================================
// Revision loop — smoke gate failure
// ============================================================================

describe("orchestrator revision loop — smoke failure", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("loop-smoke-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  it("retries on smoke failure with violations included in critique", async () => {
    let attempts = 0;
    const seenCritiques = [];
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null },
      maxRetries: 3,
      authorCall: async ({ priorCritique }) => {
        seenCritiques.push(priorCritique);
        attempts++;
        return validAuthorOutput();
      },
      editorCall: async () => alwaysApproveEditor(),
      smokeGateFn: () => {
        if (attempts === 1) {
          return {
            passed: false,
            failures: [
              "source-scan violation: script.js:3 outbound fetch() — remove the fetch call",
              "history-entrance: link to /archive/ is display:none",
            ],
          };
        }
        return alwaysPassSmoke();
      },
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });

    expect(result.success).toBe(true);
    expect(result.retriesUsed).toBe(1);
    expect(seenCritiques[1]).toMatch(/Smoke tests rejected/);
    expect(seenCritiques[1]).toMatch(/outbound fetch/);
    expect(seenCritiques[1]).toMatch(/display:none/);
  });
});

// ============================================================================
// Revision loop — retry exhaustion
// ============================================================================

describe("orchestrator revision loop — retry exhaustion", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("loop-exhaust-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  it("aborts after 3 retries with no archive written", async () => {
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null },
      maxRetries: 3,
      authorCall: async () => validAuthorOutput(),
      editorCall: async () => ({
        decision: "reject",
        critique: "still bad",
        sensitivity_check: "non_topical",
      }),
      smokeGateFn: () => alwaysPassSmoke(),
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });

    expect(result.success).toBe(false);
    expect(result.failureReason).toMatch(/exhausted/i);
    // 0, 1, 2, 3 attempts attempted (initial + 3 retries) before giving up.
    expect(result.retriesUsed).toBeGreaterThanOrEqual(3);
  });

  it("respects --max-retries=0 (single attempt, no retries)", async () => {
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null },
      maxRetries: 0,
      authorCall: async () => validAuthorOutput(),
      editorCall: async () => ({
        decision: "reject",
        critique: "no good",
        sensitivity_check: "non_topical",
      }),
      smokeGateFn: () => alwaysPassSmoke(),
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });

    expect(result.success).toBe(false);
    expect(result.retriesUsed).toBe(1);
  });
});

// ============================================================================
// Performance log slicing — diversity windows
// ============================================================================

describe("orchestrator slicePerformanceLog()", () => {
  function entry(themeKeys, topicalHook = null) {
    return {
      date: "2026-01-01",
      meta: { theme_keys: themeKeys, topical_hook: topicalHook },
      ratings: null,
      engagement: null,
      editor_notes: null,
    };
  }

  it("slices to the documented window sizes", () => {
    const log = Array.from({ length: 12 }, (_, i) =>
      entry([`theme-${i}`], `hook-${i}`)
    );
    const sliced = orchestrator.slicePerformanceLog(log);
    expect(sliced.themeDiversity).toHaveLength(orchestrator.THEME_DIVERSITY_N);
    expect(sliced.topicalClustering).toHaveLength(orchestrator.TOPICAL_CLUSTERING_N);
    expect(sliced.ratingContext).toHaveLength(orchestrator.RATING_CONTEXT_N);
    expect(sliced.recentThemeKeys).toContain("theme-0");
    expect(sliced.recentThemeKeys).toContain("theme-7");
    expect(sliced.recentThemeKeys).not.toContain("theme-8");
    expect(sliced.recentTopicalHooks).toEqual([
      "hook-0",
      "hook-1",
      "hook-2",
      "hook-3",
    ]);
  });

  it("dedupes theme keys", () => {
    const log = [
      entry(["airline"]),
      entry(["airline", "retro"]),
      entry(["retro"]),
    ];
    const sliced = orchestrator.slicePerformanceLog(log);
    expect(sliced.recentThemeKeys.sort()).toEqual(["airline", "retro"]);
  });

  it("handles an empty log", () => {
    const sliced = orchestrator.slicePerformanceLog([]);
    expect(sliced.themeDiversity).toEqual([]);
    expect(sliced.topicalClustering).toEqual([]);
    expect(sliced.ratingContext).toEqual([]);
    expect(sliced.recentThemeKeys).toEqual([]);
    expect(sliced.recentTopicalHooks).toEqual([]);
  });
});

// ============================================================================
// Topical brief absence
// ============================================================================

describe("orchestrator topical brief absence", () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir("loop-topical-");
  });

  afterEach(() => {
    rmTempDir(tmp);
  });

  it("handles { topical: false } without crashing", async () => {
    let observedBrief = null;
    const result = await orchestrator.runRevisionLoop({
      configs: fakeConfigs(),
      performanceLog: [],
      topicalBrief: { topical: false, brief: null, hook: null },
      maxRetries: 3,
      authorCall: async ({ topicalBrief }) => {
        observedBrief = topicalBrief;
        return validAuthorOutput();
      },
      editorCall: async () => alwaysApproveEditor(),
      smokeGateFn: () => alwaysPassSmoke(),
      freezeFn: freezeArchive.freeze,
      outputDir: tmp,
      cspNonce: fixedNonce(),
    });
    expect(result.success).toBe(true);
    expect(observedBrief).toEqual({ topical: false, brief: null, hook: null });
  });
});

// ============================================================================
// Dry-run mode + CLI parsing
// ============================================================================

describe("orchestrator parseCliArgs", () => {
  it("defaults to dryRun=false, today, retries=3", () => {
    const opts = orchestrator.parseCliArgs([]);
    expect(opts.dryRun).toBe(false);
    expect(opts.maxRetries).toBe(3);
    expect(opts.artifactDate).toBeNull();
    expect(opts.fixturePath).toBeNull();
  });

  it("parses --dry-run", () => {
    const opts = orchestrator.parseCliArgs(["--dry-run"]);
    expect(opts.dryRun).toBe(true);
  });

  it("parses --artifact-date and --max-retries", () => {
    const opts = orchestrator.parseCliArgs([
      "--artifact-date",
      "2026-06-01",
      "--max-retries",
      "5",
    ]);
    expect(opts.artifactDate).toBe("2026-06-01");
    expect(opts.maxRetries).toBe(5);
  });

  it("rejects unknown flags", () => {
    expect(() => orchestrator.parseCliArgs(["--bogus"])).toThrow(/unknown/i);
  });

  it("rejects negative --max-retries", () => {
    expect(() =>
      orchestrator.parseCliArgs(["--max-retries", "-1"])
    ).toThrow(/non-negative/i);
  });
});

describe("orchestrator main() in dry-run mode", () => {
  // Use overrides to avoid the real config read and real smoke gate, both of
  // which depend on the live repo. This test verifies main()'s wiring under
  // dry-run conditions without spinning up vitest-in-vitest.
  it("writes to a /tmp/ output dir and emits a success summary", async () => {
    const tmp = makeTempDir("main-dryrun-");
    const stdoutCapture = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk) => {
      stdoutCapture.push(String(chunk));
      return true;
    };
    try {
      const code = await orchestrator.main(
        ["--dry-run", "--artifact-date", "2099-01-01"],
        {
          configs: fakeConfigs(),
          performanceLog: [],
          topicalBrief: { topical: false, brief: null, hook: null },
          outputDir: tmp,
          cspNonce: fixedNonce(),
          authorCall: async () => validAuthorOutput(),
          editorCall: async () => alwaysApproveEditor(),
          smokeGateFn: () => alwaysPassSmoke(),
          freezeFn: freezeArchive.freeze,
          skipStage: true,
        }
      );
      expect(code).toBe(0);
      const finalLine = stdoutCapture.join("").trim().split("\n").pop();
      const summary = JSON.parse(finalLine);
      expect(summary.success).toBe(true);
      expect(summary.dry_run).toBe(true);
      expect(summary.cycle_date).toBe("2099-01-01");
      expect(summary.theme_name).toBe("test-drop");
    } finally {
      process.stdout.write = origWrite;
      rmTempDir(tmp);
    }
  });

  it("emits a failure summary with non-zero exit on retry exhaustion", async () => {
    const tmp = makeTempDir("main-fail-");
    const stdoutCapture = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk) => {
      stdoutCapture.push(String(chunk));
      return true;
    };
    try {
      const code = await orchestrator.main(
        ["--dry-run", "--artifact-date", "2099-01-02"],
        {
          configs: fakeConfigs(),
          performanceLog: [],
          topicalBrief: { topical: false, brief: null, hook: null },
          outputDir: tmp,
          cspNonce: fixedNonce(),
          authorCall: async () => validAuthorOutput(),
          editorCall: async () => ({
            decision: "reject",
            critique: "still off",
            sensitivity_check: "non_topical",
          }),
          smokeGateFn: () => alwaysPassSmoke(),
          freezeFn: freezeArchive.freeze,
          skipStage: true,
        }
      );
      expect(code).not.toBe(0);
      const finalLine = stdoutCapture.join("").trim().split("\n").pop();
      const summary = JSON.parse(finalLine);
      expect(summary.success).toBe(false);
      expect(summary.failure_reason).toMatch(/exhausted/i);
    } finally {
      process.stdout.write = origWrite;
      rmTempDir(tmp);
    }
  });
});

// ============================================================================
// Inlined notification templates
// ============================================================================

describe("notification templates", () => {
  it("exports PR_BODY_TEMPLATE with the expected placeholders", () => {
    expect(orchestrator.PR_BODY_TEMPLATE).toContain("${theme_name}");
    expect(orchestrator.PR_BODY_TEMPLATE).toContain("${editorial_note}");
    expect(orchestrator.PR_BODY_TEMPLATE).toContain("${tweet_draft}");
    expect(orchestrator.PR_BODY_TEMPLATE).toContain("${screenshot_brief}");
  });

  it("exports SUCCESS_ISSUE_TEMPLATE with rating CTA", () => {
    expect(orchestrator.SUCCESS_ISSUE_TEMPLATE).toContain("Drop shipped");
    expect(orchestrator.SUCCESS_ISSUE_TEMPLATE).toContain("rating.json");
  });

  it("exports FAILURE_ISSUE_TEMPLATE with git revert command", () => {
    expect(orchestrator.FAILURE_ISSUE_TEMPLATE).toContain("Cycle failed");
    expect(orchestrator.FAILURE_ISSUE_TEMPLATE).toContain("git revert");
  });
});

// ============================================================================
// Sanity: constants exported per DC10
// ============================================================================

describe("DC10 + DC9 constants", () => {
  it("exports the documented diversity-memory window sizes", () => {
    expect(orchestrator.THEME_DIVERSITY_N).toBe(8);
    expect(orchestrator.TOPICAL_CLUSTERING_N).toBe(4);
    expect(orchestrator.RATING_CONTEXT_N).toBe(12);
  });

  it("exports the documented turn/wallclock caps", () => {
    expect(orchestrator.MAX_TURNS).toBe(60);
    expect(orchestrator.MAX_RUN_MINUTES).toBe(45);
  });
});
