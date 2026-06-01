import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  listArtifactFiles,
  resolveArtifactPath,
} from "../helpers/artifact-env.js";

// DC4: per-archive size budget. Target 2MB, hard cap 5MB. No base64-inlined
// asset over 50KB (encourages external file references instead of inline blobs).

const ARTIFACT_PATH = resolveArtifactPath(process.env.ARTIFACT_PATH);
const MB = 1024 * 1024;
const KB = 1024;

const TARGET_BYTES = 2 * MB;
const HARD_CAP_BYTES = 5 * MB;
const BASE64_INLINE_LIMIT_BYTES = 50 * KB;

describe.skipIf(!ARTIFACT_PATH)("archive size budget", () => {
  it("total artifact size is under the 5MB hard cap", () => {
    const files = listArtifactFiles(ARTIFACT_PATH);
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const totalMb = (totalBytes / MB).toFixed(2);

    expect(
      totalBytes,
      `artifact total size ${totalMb}MB exceeds 5MB hard cap. ` +
        `Largest files: ${largestFiles(files, 5)
          .map((f) => `${f.relative} (${(f.size / KB).toFixed(0)}KB)`)
          .join(", ")}`
    ).toBeLessThanOrEqual(HARD_CAP_BYTES);
  });

  it("warns when total size exceeds 2MB target (non-blocking)", () => {
    const files = listArtifactFiles(ARTIFACT_PATH);
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes > TARGET_BYTES && totalBytes <= HARD_CAP_BYTES) {
      console.warn(
        `[archive-size] artifact is ${(totalBytes / MB).toFixed(2)}MB ` +
          `(over 2MB target, under 5MB cap). Consider trimming.`
      );
    }
    expect(totalBytes).toBeGreaterThan(0);
  });

  it("rejects base64-inlined blobs larger than 50KB in HTML/JS files", () => {
    const files = listArtifactFiles(ARTIFACT_PATH);
    const offenders = [];
    for (const f of files) {
      if (!/\.(html?|js|css)$/i.test(f.relative)) continue;
      const source = fs.readFileSync(f.absolute, "utf8");
      // Match base64 data URIs and standalone base64 blobs over the limit.
      const dataUriRe = /data:[a-z0-9\-+/]+;base64,([A-Za-z0-9+/=]+)/g;
      let m;
      while ((m = dataUriRe.exec(source)) !== null) {
        const b64 = m[1];
        const decodedBytes = Math.floor((b64.length * 3) / 4);
        if (decodedBytes > BASE64_INLINE_LIMIT_BYTES) {
          offenders.push({
            file: f.relative,
            decodedKb: Math.round(decodedBytes / KB),
          });
        }
      }
    }
    expect(
      offenders,
      `base64-inlined blobs over 50KB found. Use external asset files instead. ` +
        `Offenders: ${offenders.map((o) => `${o.file} (${o.decodedKb}KB)`).join("; ")}`
    ).toHaveLength(0);
  });
});

function largestFiles(files, n) {
  return [...files].sort((a, b) => b.size - a.size).slice(0, n);
}
