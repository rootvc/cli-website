// rating-schema.js — JSON Schema for archive/YYYY-MM-DD/rating.json.
// CI uses this on any PR touching archive/*/rating.json so malformed edits
// don't reach main. Format: an array of entries, each carrying who rated,
// the 1-5 rating, an optional note, and an ISO8601 timestamp.

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://root.vc/schemas/cycle-rating.json",
  title: "Cycle drop rating",
  description:
    "Array of team member ratings for a single daily cycle incarnation. Append-only; multiple entries from the same rater are allowed (the latest reflects current opinion).",
  type: "array",
  items: {
    type: "object",
    required: ["rater", "rating", "ts"],
    additionalProperties: false,
    properties: {
      rater: {
        type: "string",
        minLength: 1,
        maxLength: 80,
        description: "GitHub handle or display name of the rater",
      },
      rating: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description: "1-5 star rating (DC10 default rating context N=12)",
      },
      note: {
        type: "string",
        maxLength: 1000,
        description: "Optional free-text note explaining the rating",
      },
      ts: {
        type: "string",
        format: "date-time",
        description: "ISO8601 timestamp of when the rating was submitted",
      },
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
