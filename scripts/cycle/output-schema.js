// output-schema.js — JSON Schema + ajv-compiled validator for the Author's
// structured output. Per High-Level Technical Design in the plan, the Author
// returns a single object containing the site files, meta, and social press
// kit. This file is the load-bearing contract between Author, Editor, and
// freeze-archive — schema failures route to an Author retry.
//
// Consumed by:
//   - scripts/cycle/run-cycle.js (orchestrator; validates each Author output)
//   - scripts/cycle/freeze-archive.js (assumes validated input)
//   - scripts/cycle/prompts/author-role.md (referenced for the Author's output
//     contract; keep the schema and the prompt's recap in lockstep)
//
// Returns { schema, validate }. validate(output) returns
// { valid: boolean, errors: string[] }. Errors are the ajv error messages
// flattened to human-readable strings the Author can act on in a retry.

const Ajv = require("ajv");

// JSON Schema (draft-07) describing the Author output. Comments inline at the
// property level explain the intent; matching prose lives in
// prompts/author-role.md.
const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["site", "meta", "social"],
  additionalProperties: false,
  properties: {
    // The shipped artifact's filesystem layout. Keys are paths relative to
    // archive/YYYY-MM-DD/; values are file contents (strings only — binary
    // assets aren't supported in v1).
    site: {
      type: "object",
      required: ["files"],
      additionalProperties: false,
      properties: {
        files: {
          type: "object",
          // At minimum, the artifact MUST have an index.html. Other files
          // (style.css, script.js, asset paths under assets/) are optional
          // but encouraged. Each value is the file's full text contents.
          required: ["index.html"],
          additionalProperties: { type: "string" },
          properties: {
            "index.html": { type: "string", minLength: 1 },
          },
        },
      },
    },
    meta: {
      type: "object",
      required: [
        "theme_name",
        "editorial_note",
        "where_facts_live",
        // history_view_concept was required pre-wayback-strip. Now optional;
        // the strip is the canonical history entrance. Field is still allowed.
        "theme_keys",
        "topical",
        "csp_nonce",
      ],
      additionalProperties: false,
      properties: {
        // Kebab-case slug — short, memorable. The freeze-archive step does
        // NOT use this in paths (paths are date-based) but the post-merge
        // notification surface uses it as a human label.
        theme_name: {
          type: "string",
          pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
          minLength: 1,
          maxLength: 80,
        },
        // 1-3 sentences explaining the concept AND any anchor-fact omissions
        // (DC6) so the Editor and smoke tests can verify the rationale.
        editorial_note: {
          type: "string",
          minLength: 10,
          maxLength: 2000,
        },
        // Human-readable hints, not test-enforced (per plan). Each value is
        // a CSS selector OR a prose location description, used by reviewers
        // to verify the fact is actually surfaced.
        where_facts_live: {
          type: "object",
          required: ["firm_name", "mission", "portfolio", "team", "contact"],
          additionalProperties: false,
          properties: {
            firm_name: { type: "string", minLength: 1 },
            mission: { type: "string", minLength: 1 },
            portfolio: { type: "string", minLength: 1 },
            team: { type: "string", minLength: 1 },
            contact: { type: "string", minLength: 1 },
          },
        },
        // 1-2 sentences on how the in-world history entrance reads. Free
        // text. The Editor reviews this; smoke tests verify a real link
        // exists separately (DC7).
        history_view_concept: {
          type: "string",
          minLength: 10,
          maxLength: 1000,
        },
        // 1-8 short keys used by the diversity memory to avoid repeating
        // themes too often. Author should pick the keys honestly.
        theme_keys: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 60,
          },
        },
        // Whether this drop rides a topical hook from the fetcher. If true,
        // topical_hook and topical_brief MUST be present (enforced via
        // allOf below).
        topical: { type: "boolean" },
        topical_hook: { type: "string", minLength: 1, maxLength: 280 },
        topical_brief: {
          type: "array",
          maxItems: 8,
          items: { type: "string", minLength: 1 },
        },
        // The CSP nonce inserted into every <script> tag and into the
        // artifact's meta tag. Freeze-archive validates that this value
        // appears in the index.html and rejects if missing. Authors leave
        // the placeholder `{{CSP_NONCE}}` in their <script> tags and the
        // orchestrator replaces it with a generated nonce at freeze time;
        // this field carries the resolved nonce post-freeze.
        csp_nonce: {
          type: "string",
          minLength: 8,
          maxLength: 64,
        },
      },
      // If topical is true, both topical_hook and topical_brief are required.
      allOf: [
        {
          if: { properties: { topical: { const: true } } },
          then: { required: ["topical_hook", "topical_brief"] },
        },
      ],
    },
    social: {
      type: "object",
      required: ["tweet_draft", "tweet_thread", "linkedin_draft", "screenshot_brief"],
      additionalProperties: false,
      properties: {
        // Single-tweet copy. <= 280 chars (Twitter's hard cap).
        tweet_draft: {
          type: "string",
          minLength: 1,
          maxLength: 280,
        },
        // Optional thread. Each entry is one tweet; same 280-char limit
        // per entry. May be empty array if no thread is appropriate.
        tweet_thread: {
          type: "array",
          maxItems: 12,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 280,
          },
        },
        // LinkedIn post copy. LinkedIn allows ~3000 chars; cap a bit short.
        linkedin_draft: {
          type: "string",
          minLength: 1,
          maxLength: 2500,
        },
        // 1-3 sentences describing what to screenshot for the social post.
        screenshot_brief: {
          type: "string",
          minLength: 10,
          maxLength: 1000,
        },
      },
    },
  },
};

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  // ajv@8 enables draft-07 by default; the explicit $schema in the schema
  // above is for human reference, not ajv enforcement.
});
const compiledValidate = ajv.compile(schema);

function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) return [];
  return errors.map((err) => {
    const path = err.instancePath || "(root)";
    const params = err.params ? JSON.stringify(err.params) : "";
    return `${path} ${err.message}${params ? " " + params : ""}`.trim();
  });
}

function validate(output) {
  const valid = compiledValidate(output) === true;
  const errors = valid ? [] : formatAjvErrors(compiledValidate.errors);
  return { valid, errors };
}

module.exports = {
  schema,
  validate,
};
