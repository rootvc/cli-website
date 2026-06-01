import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  loadArtifactDom,
  resolveArtifactPath,
} from "../helpers/artifact-env.js";

// Basic structural sanity checks that apply to every artifact (legacy and
// generated): the page loads, has a title, no NEW console errors, and no
// broken relative path references in href/src attributes.
//
// Known JSDOM warnings (CSS parse failures, unsupported APIs) are allowlisted
// so the smoke test only fails on errors introduced by the artifact itself.

const ARTIFACT_PATH = resolveArtifactPath(process.env.ARTIFACT_PATH);

const JSDOM_NOISE_ALLOWLIST = [
  /Could not parse CSS stylesheet/,
  /Not implemented: HTMLCanvasElement\.prototype/,
  /Not implemented: window\.scroll/,
  /Not implemented: navigation/,
  /jsdom/i,
];

describe.skipIf(!ARTIFACT_PATH)("structural sanity", () => {
  let env;

  beforeEach(() => {
    env = null;
  });

  afterEach(() => {
    if (env) env.cleanup();
  });

  it("loads in JSDOM and exposes a non-empty <title>", () => {
    env = loadArtifactDom(ARTIFACT_PATH);
    const title = env.document.querySelector("title");
    expect(title, "artifact must have a <title> element").not.toBeNull();
    expect(
      (title.textContent || "").trim().length,
      "<title> must be non-empty"
    ).toBeGreaterThan(0);
  });

  it("does not throw new console.error during initial render", () => {
    env = loadArtifactDom(ARTIFACT_PATH);
    const meaningful = env.consoleErrors.filter(
      (msg) => !JSDOM_NOISE_ALLOWLIST.some((re) => re.test(msg))
    );
    expect(
      meaningful,
      `unexpected console.error during render: ${meaningful.join(" | ")}`
    ).toHaveLength(0);
  });

  it("does not reference broken relative href/src paths", () => {
    env = loadArtifactDom(ARTIFACT_PATH);
    const broken = [];

    const elements = Array.from(
      env.document.querySelectorAll("a[href], link[href], script[src], img[src]")
    );
    for (const el of elements) {
      const attr = el.tagName === "A" || el.tagName === "LINK" ? "href" : "src";
      const value = el.getAttribute(attr);
      if (!value) continue;
      if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("//") ||
        value.startsWith("mailto:") ||
        value.startsWith("tel:") ||
        value.startsWith("#") ||
        value.startsWith("data:") ||
        value.startsWith("javascript:")
      ) {
        continue;
      }
      // Root-anchored paths reference the live site, not the artifact.
      // Skip them — they're handled by the live deploy.
      if (value.startsWith("/")) continue;
      // Relative paths must resolve to a file within the artifact directory.
      const cleaned = value.replace(/^\.\//, "").split("?")[0].split("#")[0];
      const candidate = path.join(ARTIFACT_PATH, cleaned);
      if (!fs.existsSync(candidate)) {
        broken.push({ tag: el.tagName.toLowerCase(), [attr]: value });
      }
    }

    expect(
      broken,
      `broken relative references: ${JSON.stringify(broken)}`
    ).toHaveLength(0);
  });
});
