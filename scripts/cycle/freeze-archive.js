// freeze-archive.js — Writes a validated Author output to a target archive
// directory. Creates index.html + all asset files + meta.json + social.json +
// empty rating.json + empty engagement.json. Replaces the Author's
// `{{CSP_NONCE}}` placeholder with the resolved nonce from meta.csp_nonce in
// every <script> tag and in the artifact's <meta name="csp-nonce"> tag.
//
// Does NOT call git — the orchestrator (or U6 workflow) stages and commits
// separately so this module stays focused on filesystem layout.
//
// Per the plan (DC4), per-archive size budget is 2MB target / 5MB hard cap.
// This module does NOT enforce that — smoke tests do, post-freeze, so the
// Author can be retried with a "too big" critique. Freeze just writes.
//
// Per DC11, the resolved CSP nonce is also embedded in the HTML so the
// deploy-layer CSP header (set in vercel.json) can validate it. The Author's
// placeholder `{{CSP_NONCE}}` MUST appear in the index.html on every <script>
// tag the Author emits; freeze rejects (throws) if the placeholder is absent.
// (Soft-rejecting via throw routes back to the orchestrator's retry loop.)
//
// Returns { freeze({ outputDir, authorOutput }) => { artifactPath, files } }.

const fs = require("node:fs");
const path = require("node:path");

// Markers we replace in the Author's HTML. Author is instructed to put
// `{{CSP_NONCE}}` on every <script> tag's nonce attribute.
const CSP_NONCE_PLACEHOLDER = "{{CSP_NONCE}}";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isScriptOrHtmlFile(relPath) {
  return /\.(html?|js)$/i.test(relPath);
}

function isHtmlFile(relPath) {
  return /\.html?$/i.test(relPath);
}

// Replace `{{CSP_NONCE}}` in script tags and meta tags. Conservative: only
// replaces the exact placeholder text, not anything tricky. If the Author
// emitted a script tag without the placeholder, we DON'T silently inject the
// nonce — the smoke tests' source scan will flag scripts that lack the
// nonce attribute via the deploy CSP.
function applyCspNonce(content, nonce, relPath) {
  if (!nonce) return content;
  // Replace ALL occurrences of the placeholder, not just the first. Authors
  // emit multiple script tags so a single-instance replace is wrong.
  return content.split(CSP_NONCE_PLACEHOLDER).join(nonce);
}

// Validate that, for HTML files, the Author actually emitted the placeholder
// somewhere — otherwise CSP enforcement fails silently and the artifact
// won't run in the deployed environment. This is a soft pre-flight gate;
// the orchestrator catches the thrown error and routes to a retry.
function validateNoncePresence(files, nonce) {
  if (!nonce) return; // No nonce required (e.g. dry-run with stub)
  // Check the index.html in particular — every artifact has one. If it has
  // no <script> tags at all, that's fine (no nonce needed). Otherwise it
  // MUST reference the nonce.
  const indexHtml = files["index.html"];
  if (!indexHtml) return; // Schema enforces presence; defensive guard.
  const hasScript = /<script\b/i.test(indexHtml);
  if (!hasScript) return;
  const referencesNonce =
    indexHtml.includes(CSP_NONCE_PLACEHOLDER) || indexHtml.includes(nonce);
  if (!referencesNonce) {
    throw new Error(
      `index.html contains <script> tags but no CSP nonce reference. ` +
        `Author must include nonce="${CSP_NONCE_PLACEHOLDER}" on every <script> tag.`
    );
  }
}

function writeFiles(outputDir, files, nonce) {
  const written = [];
  for (const [relPath, content] of Object.entries(files)) {
    if (typeof content !== "string") {
      throw new Error(`Author output file ${relPath} is not a string`);
    }
    // Resolved file path. Reject anything trying to escape the outputDir
    // via ../ traversal — the schema's additionalProperties: { type: string }
    // allows arbitrary keys, so we defend here.
    const absPath = path.resolve(outputDir, relPath);
    const absOut = path.resolve(outputDir);
    if (!absPath.startsWith(absOut + path.sep) && absPath !== absOut) {
      throw new Error(`Author output file ${relPath} escapes archive directory`);
    }

    ensureDir(path.dirname(absPath));

    const finalContent = isScriptOrHtmlFile(relPath)
      ? applyCspNonce(content, nonce, relPath)
      : content;

    fs.writeFileSync(absPath, finalContent);
    written.push(relPath);
  }
  return written;
}

function writeMeta(outputDir, meta) {
  // The Author's full meta object — including theme_name, theme_keys,
  // topical, csp_nonce, etc. — is written as-is. Smoke tests and the next
  // cycle's performance log read this back.
  const metaPath = path.join(outputDir, "meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  return "meta.json";
}

function writeSocial(outputDir, social) {
  const socialPath = path.join(outputDir, "social.json");
  fs.writeFileSync(socialPath, JSON.stringify(social, null, 2) + "\n");
  return "social.json";
}

// Initialize empty rating/engagement files so the team can populate them
// later via PR. Per R17 + the plan, absent files are treated as null
// (neutral) by performance-log.js — so writing empty arrays/objects here is
// a meaningful choice: it says "this drop has been published; ready for
// rating." performance-log.js distinguishes null (file absent) from empty
// (file present, no ratings yet).
function writeEmptyRating(outputDir) {
  const p = path.join(outputDir, "rating.json");
  fs.writeFileSync(p, "[]\n");
  return "rating.json";
}

function writeEmptyEngagement(outputDir) {
  const p = path.join(outputDir, "engagement.json");
  fs.writeFileSync(p, "{}\n");
  return "engagement.json";
}

function freeze({ outputDir, authorOutput }) {
  if (!outputDir) throw new Error("freeze: outputDir is required");
  if (!authorOutput) throw new Error("freeze: authorOutput is required");
  if (!authorOutput.site || !authorOutput.site.files) {
    throw new Error("freeze: authorOutput.site.files is missing");
  }
  if (!authorOutput.meta) {
    throw new Error("freeze: authorOutput.meta is missing");
  }
  if (!authorOutput.social) {
    throw new Error("freeze: authorOutput.social is missing");
  }

  const nonce = authorOutput.meta.csp_nonce;
  // Pre-flight check on the index.html before we touch the filesystem so an
  // error doesn't leave a half-written archive directory behind.
  validateNoncePresence(authorOutput.site.files, nonce);

  ensureDir(outputDir);
  const fileResults = writeFiles(outputDir, authorOutput.site.files, nonce);
  fileResults.push(writeMeta(outputDir, authorOutput.meta));
  fileResults.push(writeSocial(outputDir, authorOutput.social));
  fileResults.push(writeEmptyRating(outputDir));
  fileResults.push(writeEmptyEngagement(outputDir));

  return {
    artifactPath: outputDir,
    files: fileResults,
  };
}

module.exports = {
  freeze,
  CSP_NONCE_PLACEHOLDER,
};
