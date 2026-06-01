import { describe, expect, it } from "vitest";
import path from "node:path";
import { REPO_ROOT } from "../helpers/browser-env.js";

const { validate: validateRating } = require(
  path.join(REPO_ROOT, "scripts/cycle/rating-schema.js")
);
const { validate: validateEngagement } = require(
  path.join(REPO_ROOT, "scripts/cycle/engagement-schema.js")
);

describe("rating-schema", () => {
  it("accepts an empty array (no ratings yet)", () => {
    const { valid } = validateRating([]);
    expect(valid).toBe(true);
  });

  it("accepts a single valid rating entry", () => {
    const { valid } = validateRating([
      {
        rater: "lee",
        rating: 4,
        note: "loved the in-flight magazine concept",
        ts: "2026-06-08T16:42:00Z",
      },
    ]);
    expect(valid).toBe(true);
  });

  it("accepts multiple ratings from the same rater (append-only)", () => {
    const { valid } = validateRating([
      { rater: "lee", rating: 3, ts: "2026-06-08T09:00:00Z" },
      { rater: "lee", rating: 5, note: "grew on me", ts: "2026-06-09T22:00:00Z" },
    ]);
    expect(valid).toBe(true);
  });

  it("rejects rating outside 1-5", () => {
    const { valid, errors } = validateRating([
      { rater: "lee", rating: 7, ts: "2026-06-08T16:42:00Z" },
    ]);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.message.includes("<= 5"))).toBe(true);
  });

  it("rejects missing required fields (rater)", () => {
    const { valid } = validateRating([{ rating: 4, ts: "2026-06-08T16:42:00Z" }]);
    expect(valid).toBe(false);
  });

  it("rejects malformed timestamps", () => {
    const { valid } = validateRating([
      { rater: "lee", rating: 4, ts: "yesterday" },
    ]);
    expect(valid).toBe(false);
  });

  it("rejects unknown top-level fields (additionalProperties: false)", () => {
    const { valid } = validateRating([
      {
        rater: "lee",
        rating: 4,
        ts: "2026-06-08T16:42:00Z",
        sneaky: "extra field",
      },
    ]);
    expect(valid).toBe(false);
  });
});

describe("engagement-schema", () => {
  it("accepts an empty object (no engagement yet)", () => {
    const { valid } = validateEngagement({});
    expect(valid).toBe(true);
  });

  it("accepts a full populated record", () => {
    const { valid } = validateEngagement({
      twitter: 42,
      twitter_link_shares: 9,
      hn: {
        url: "https://news.ycombinator.com/item?id=123",
        score: 187,
        comments: 42,
      },
      linkedin: { reactions: 23, comments: 4, shares: 1 },
      reddit: [
        {
          subreddit: "r/programming",
          url: "https://reddit.com/r/programming/comments/abc",
          score: 311,
          comments: 67,
        },
      ],
      manual_notes: "Substack picked it up on Wednesday",
      last_updated: "2026-06-14T20:00:00Z",
    });
    expect(valid).toBe(true);
  });

  it("rejects negative integer counts", () => {
    const { valid } = validateEngagement({ twitter: -1 });
    expect(valid).toBe(false);
  });

  it("rejects malformed subreddit", () => {
    const { valid } = validateEngagement({
      reddit: [{ subreddit: "programming", score: 10, comments: 2 }],
    });
    expect(valid).toBe(false);
  });

  it("rejects unknown top-level fields", () => {
    const { valid } = validateEngagement({ twitter: 10, junk: true });
    expect(valid).toBe(false);
  });
});
