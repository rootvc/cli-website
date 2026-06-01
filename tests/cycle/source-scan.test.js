import { describe, expect, it } from "vitest";
import { readArtifactMeta, resolveArtifactPath } from "../helpers/artifact-env.js";

const { scanArtifact } = require("../../scripts/cycle/source-scan.js");

const ARTIFACT_PATH = resolveArtifactPath(process.env.ARTIFACT_PATH);
const ARTIFACT_META = ARTIFACT_PATH ? readArtifactMeta(ARTIFACT_PATH) : null;
const IS_LEGACY = ARTIFACT_META && ARTIFACT_META.legacy === true;

// DC11 source-scan applies only to AI-generated artifacts. Legacy entries
// (the CLI snapshot etc.) contain hand-written code that legitimately uses
// fetch/eval/dynamic scripts; that code is reviewed by humans, not by this
// deny-list. DC1's legacy waiver covers this.

describe.skipIf(!ARTIFACT_PATH || IS_LEGACY)("source scan (DC11)", () => {
  it("AI-generated JS contains no outbound-network or dynamic-script patterns", () => {
    const result = scanArtifact(ARTIFACT_PATH);

    expect(
      result.violations,
      `source-scan violations in ${ARTIFACT_PATH}: ` +
        result.violations
          .map((v) => `${v.file}:${v.line} ${v.label} (${v.snippet})`)
          .join("; ")
    ).toHaveLength(0);
  });

  it("scanned at least one file (artifact is not empty)", () => {
    const result = scanArtifact(ARTIFACT_PATH);
    expect(result.scannedFiles).toBeGreaterThan(0);
  });
});
