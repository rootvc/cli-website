// engagement-schema.js — JSON Schema for archive/YYYY-MM-DD/engagement.json.
// CI validates on PRs touching archive/*/engagement.json. v1 populates this
// manually; an auto-tracker is deferred per Scope Boundaries.

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://root.vc/schemas/cycle-engagement.json",
  title: "Cycle drop engagement signal",
  description:
    "Manually-curated social engagement data for a single daily cycle incarnation. Self-improvement loop reads this alongside rating.json (DC10 rating context N=12).",
  type: "object",
  additionalProperties: false,
  properties: {
    twitter: {
      type: "integer",
      minimum: 0,
      description: "Total mentions / retweets / quote tweets observed",
    },
    twitter_link_shares: {
      type: "integer",
      minimum: 0,
      description: "Number of times an /archive/YYYY-MM-DD/ permalink was shared on Twitter/X",
    },
    hn: {
      type: "object",
      additionalProperties: false,
      properties: {
        url: { type: "string", format: "uri" },
        score: { type: "integer", minimum: 0 },
        comments: { type: "integer", minimum: 0 },
      },
      description: "Hacker News submission stats if the drop landed there",
    },
    linkedin: {
      type: "object",
      additionalProperties: false,
      properties: {
        reactions: { type: "integer", minimum: 0 },
        comments: { type: "integer", minimum: 0 },
        shares: { type: "integer", minimum: 0 },
      },
    },
    reddit: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subreddit"],
        properties: {
          subreddit: { type: "string", pattern: "^r/[A-Za-z0-9_]+$" },
          url: { type: "string", format: "uri" },
          score: { type: "integer", minimum: 0 },
          comments: { type: "integer", minimum: 0 },
        },
      },
    },
    manual_notes: {
      type: "string",
      maxLength: 2000,
      description: "Free-text notes — anything not captured in the structured fields",
    },
    last_updated: {
      type: "string",
      format: "date-time",
      description: "ISO8601 timestamp of the most recent manual update",
    },
  },
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validator = ajv.compile(schema);

function validate(value) {
  const valid = validator(value);
  return {
    valid,
    errors: valid ? [] : validator.errors.map((e) => ({
      instancePath: e.instancePath,
      message: e.message,
      params: e.params,
    })),
  };
}

module.exports = { schema, validate };
