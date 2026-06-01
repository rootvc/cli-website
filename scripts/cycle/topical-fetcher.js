// topical-fetcher.js — Interface module for the optional pre-Author topical
// brief (U5). Like Author/Editor in U4, the actual LLM call happens through
// Claude Code's Agent + Skill/WebSearch tools at cycle runtime; this module
// owns the schema, the injection-pattern sanitizer, the fail-soft contract,
// and the dry-run stub.
//
// Schema for the fetcher's structured output (returned by the fetcher subagent
// at runtime):
//
//   {
//     topical: boolean,
//     hook: string | null,           // the single most-promising thread to riff on
//     brief: string[] | null,        // 3-5 short bullets, each in the fetcher's own words
//     source_summary: string,        // one-sentence note on which sources actually returned signal
//     all_sensitivity_tiers: ("hard_block" | "soft_block" | "approve" | "lean_in")[]
//   }
//
// Author + Editor see only the post-sanitization version. Everything below
// is module-level public API.

const fs = require("node:fs");
const path = require("node:path");

const INJECTION_PATTERNS = [
  /^\s*SYSTEM\s*:/im,
  /^\s*ASSISTANT\s*:/im,
  /^\s*USER\s*:/im,
  /^\s*IGNORE\s+(PRIOR|PREVIOUS|ABOVE)/i,
  /^\s*DISREGARD\s+(PRIOR|PREVIOUS|ABOVE)/i,
  /<\/?instruction>/i,
  /<\/?system>/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|im_start\|>|<\|im_end\|>/i,
  /<\|user\|>|<\|assistant\|>/i,
];

const EMPTY_BRIEF = Object.freeze({
  topical: false,
  hook: null,
  brief: null,
  source_summary: "fetcher disabled (no input)",
  all_sensitivity_tiers: [],
});

function sanitizeBullet(bullet, droppedLog) {
  if (typeof bullet !== "string") return null;
  const trimmed = bullet.trim();
  if (trimmed.length === 0) return null;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      if (droppedLog) {
        droppedLog.push({
          reason: "injection_pattern_match",
          pattern: pattern.source,
          original: trimmed.substring(0, 100),
        });
      }
      return null;
    }
  }

  // Strip surrounding quote marks and trailing instructional fragments.
  const cleaned = trimmed
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/<\/?[a-z][^>]*>/gi, "") // strip any inline HTML/XML tags
    .trim();

  if (cleaned.length === 0) return null;
  return cleaned;
}

function sanitize(fetcherOutput) {
  // Defensive: anything not matching the expected shape collapses to EMPTY_BRIEF.
  if (!fetcherOutput || typeof fetcherOutput !== "object") {
    return { brief: { ...EMPTY_BRIEF, source_summary: "fetcher output absent" }, dropped: [] };
  }

  if (fetcherOutput.topical !== true) {
    return {
      brief: {
        ...EMPTY_BRIEF,
        source_summary:
          typeof fetcherOutput.source_summary === "string"
            ? fetcherOutput.source_summary
            : "fetcher returned no topical signal",
      },
      dropped: [],
    };
  }

  const dropped = [];
  const sanitizedBullets = Array.isArray(fetcherOutput.brief)
    ? fetcherOutput.brief.map((b) => sanitizeBullet(b, dropped)).filter(Boolean)
    : [];

  // Below 2 surviving bullets after sanitization = treat as no signal.
  if (sanitizedBullets.length < 2) {
    return {
      brief: {
        ...EMPTY_BRIEF,
        source_summary:
          dropped.length > 0
            ? `fetcher output stripped ${dropped.length} bullets for injection patterns; insufficient remaining`
            : "fetcher returned fewer than 2 bullets",
      },
      dropped,
    };
  }

  const sanitizedHook =
    typeof fetcherOutput.hook === "string"
      ? sanitizeBullet(fetcherOutput.hook, dropped)
      : null;

  const tiers = Array.isArray(fetcherOutput.all_sensitivity_tiers)
    ? fetcherOutput.all_sensitivity_tiers.filter((t) =>
        ["hard_block", "soft_block", "approve", "lean_in"].includes(t)
      )
    : [];

  return {
    brief: {
      topical: true,
      hook: sanitizedHook,
      brief: sanitizedBullets.slice(0, 5),
      source_summary:
        typeof fetcherOutput.source_summary === "string"
          ? fetcherOutput.source_summary.substring(0, 500)
          : "topical signal acquired",
      all_sensitivity_tiers: tiers,
    },
    dropped,
  };
}

// Build a dry-run stub that simulates a "no topical signal this week" outcome.
// Used when run-cycle.js is invoked with --dry-run or when the fetcher is
// disabled outright.
function buildEmptyBrief(reason = "fetcher disabled for dry-run") {
  return { ...EMPTY_BRIEF, source_summary: reason };
}

// At runtime, run-cycle.js invokes Claude Code's Agent tool with the prompt
// at scripts/cycle/prompts/topical-fetcher.md. The Agent returns a JSON object
// that this module sanitizes before passing to Author. The interface below is
// the seam — the real Agent call replaces `invokeFetcher` at runtime.
//
// For tests and dry-run, the caller passes a synchronous stub via the
// `invokeFetcher` argument. The stub returns a `fetcherOutput` matching the
// schema described at the top of this file.
async function fetchTopicalBrief({ invokeFetcher, logger }) {
  const log = logger || (() => {});

  if (typeof invokeFetcher !== "function") {
    log("topical-fetcher: no invokeFetcher provided, returning empty brief");
    return buildEmptyBrief("invokeFetcher not provided");
  }

  let raw;
  try {
    raw = await invokeFetcher();
  } catch (err) {
    log(`topical-fetcher: invocation threw (${err.message}); falling back`);
    return buildEmptyBrief(`fetcher invocation failed: ${err.message}`);
  }

  if (raw === null || raw === undefined) {
    log("topical-fetcher: invocation returned null; falling back");
    return buildEmptyBrief("fetcher returned no output");
  }

  const { brief, dropped } = sanitize(raw);

  if (dropped.length > 0) {
    log(
      `topical-fetcher: sanitizer dropped ${dropped.length} bullets for injection patterns: ` +
        dropped.map((d) => d.pattern).join(", ")
    );
  }

  return brief;
}

// Read the fetcher prompt file (used by run-cycle.js for assembling the
// fetcher's prompt at runtime).
function loadFetcherPrompt() {
  const promptPath = path.join(__dirname, "prompts", "topical-fetcher.md");
  return fs.readFileSync(promptPath, "utf8");
}

module.exports = {
  EMPTY_BRIEF,
  INJECTION_PATTERNS,
  buildEmptyBrief,
  fetchTopicalBrief,
  loadFetcherPrompt,
  sanitize,
  sanitizeBullet,
};
