// performance-log.js — Assembles the last-12-drops' performance snapshot the
// orchestrator passes to the Author subagent. Each entry combines meta.json
// (theme keys, topical flags, editorial notes), rating.json (team ratings,
// possibly absent), engagement.json (manual social counts, possibly absent),
// and any post-merge editor notes from a sibling file. The Author prompt
// uses this to (a) avoid theme re-use across the last N=8 drops, (b) avoid
// topical-hook clustering across the last N=4 drops, (c) calibrate to what
// the team actually liked across the last N=12 drops.
//
// Per the plan (DC10), the orchestrator loads the union (N=12) once and the
// Author prompt slices per window. This file emits the full 12-entry log;
// run-cycle.js does the slicing.
//
// Per the plan (DC6, R17), absent rating data is NULL, not 0. Null means
// "not yet rated" — Author treats it as a neutral signal, not a negative
// one. The Author prompt makes this explicit.
//
// Per the plan (DC1, U4 test scenario), the _legacy/ directory is excluded
// from the main log but allowed as a fallback seed for cycle 1 (when no
// generated drops exist yet). Legacy entries have hand-written meta.json
// with theme_keys that the Author can use for diversity.
//
// Returns { assemble(archiveRoot) => Array<{ date, meta, ratings, engagement,
//   editor_notes }> }. Sort order: descending by date (most-recent first).

const fs = require("node:fs");
const path = require("node:path");

const MAX_ENTRIES = 12;

// Heuristic: an archive entry's directory name should look like YYYY-MM-DD
// (an ISO calendar date). Anything else (e.g., _legacy, .gitkeep, README.md)
// is filtered out of the main log.
const DATE_DIR_RE = /^\d{4}-\d{2}-\d{2}$/;

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch (err) {
    // Malformed JSON is logged but treated as absent. The orchestrator's
    // structural tests would catch this on next cycle anyway.
    console.warn(`[performance-log] failed to parse ${filePath}: ${err.message}`);
    return null;
  }
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.trim() || null;
  } catch (err) {
    console.warn(`[performance-log] failed to read ${filePath}: ${err.message}`);
    return null;
  }
}

function loadEntry(archiveRoot, dirName) {
  const dir = path.join(archiveRoot, dirName);
  const meta = readJsonIfExists(path.join(dir, "meta.json"));
  if (!meta) {
    // No meta.json = not a recognizable archive entry. Skip.
    return null;
  }

  // rating.json is typed as Array<{ rater, rating, note, ts }>. Absent =>
  // null (NOT empty array — empty array would imply "we looked and nobody
  // rated," which is a valid future signal we want to be able to express).
  const ratingsRaw = readJsonIfExists(path.join(dir, "rating.json"));
  const ratings = ratingsRaw === null
    ? null
    : Array.isArray(ratingsRaw)
      ? ratingsRaw
      : null;

  // engagement.json is typed as { twitter, hn, linkedin?, manual_notes? }.
  // Absent => null. Empty-object presence means "checked and nothing
  // happened," which is meaningful — keep it.
  const engagement = readJsonIfExists(path.join(dir, "engagement.json"));

  // editor_notes.md is an optional plain-text file the Editor writes post-
  // approval explaining what they liked, what they pushed back on, what
  // they want next week to lean toward. Not required by the cycle but
  // valuable input for the Author when present.
  const editorNotes = readTextIfExists(path.join(dir, "editor_notes.md"));

  return {
    date: dirName,
    meta,
    ratings,
    engagement,
    editor_notes: editorNotes,
  };
}

function listArchiveDirs(archiveRoot) {
  if (!fs.existsSync(archiveRoot)) return [];
  return fs
    .readdirSync(archiveRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// Main archive entries (excludes _legacy/). Sorted descending by date so
// the orchestrator can slice "last N" by taking the first N.
function listMainEntries(archiveRoot) {
  return listArchiveDirs(archiveRoot)
    .filter((name) => DATE_DIR_RE.test(name))
    .sort((a, b) => b.localeCompare(a));
}

// Legacy entries — used ONLY when the main log is empty (cycle 1) to seed
// theme-keys memory. Their hand-written meta.json carries theme_keys the
// Author can riff off of for diversity.
function listLegacyEntries(archiveRoot) {
  const legacyRoot = path.join(archiveRoot, "_legacy");
  if (!fs.existsSync(legacyRoot)) return [];
  return fs
    .readdirSync(legacyRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join("_legacy", entry.name));
}

function assemble(archiveRoot) {
  const resolved = path.resolve(archiveRoot);
  const mainDirNames = listMainEntries(resolved).slice(0, MAX_ENTRIES);
  const mainEntries = mainDirNames
    .map((name) => loadEntry(resolved, name))
    .filter((entry) => entry !== null);

  // Per plan U4 test scenario: "On first cycle (no archives in archive/ other
  // than _legacy/), performance log is seeded from _legacy/ entries with
  // hand-written theme keys." If we have NO main entries, fall back to legacy
  // entries — but ONLY for theme-keys diversity. Their ratings/engagement
  // are not load-bearing (legacy entries pre-date the rating system).
  if (mainEntries.length === 0) {
    const legacyNames = listLegacyEntries(resolved);
    const legacyEntries = legacyNames
      .map((name) => loadEntry(resolved, name))
      .filter((entry) => entry !== null)
      // Mark legacy entries explicitly so the Author prompt can tell them
      // apart from regular drops. The Author should not weight their
      // (absent) ratings; they exist only for theme-keys diversity.
      .map((entry) => ({ ...entry, legacy: true }));
    return legacyEntries;
  }

  return mainEntries;
}

module.exports = {
  assemble,
  MAX_ENTRIES,
};
