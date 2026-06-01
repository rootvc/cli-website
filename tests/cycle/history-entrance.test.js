import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadArtifactDom,
  readArtifactMeta,
  resolveArtifactPath,
} from "../helpers/artifact-env.js";

// DC7: every artifact must include at least one discoverable in-world entrance
// to the history view. "Discoverable" means: a non-hidden anchor element whose
// href resolves to a known archive permalink, with non-empty text or
// aria-label so a visitor can actually click it.
//
// Skipped for legacy entries (they predate the system and the history view).
// Skipped entirely when ARTIFACT_PATH is unset.

const ARTIFACT_PATH = resolveArtifactPath(process.env.ARTIFACT_PATH);
const ARTIFACT_META = ARTIFACT_PATH ? readArtifactMeta(ARTIFACT_PATH) : null;
const IS_LEGACY = ARTIFACT_META && ARTIFACT_META.legacy === true;

describe.skipIf(!ARTIFACT_PATH || IS_LEGACY)("history entrance", () => {
  let env;

  beforeEach(() => {
    env = null;
  });

  afterEach(() => {
    if (env) env.cleanup();
  });

  it(
    "exposes at least one non-hidden anchor pointing to /archive/*",
    () => {
      env = loadArtifactDom(ARTIFACT_PATH);

      const candidates = Array.from(
        env.document.querySelectorAll('a[href*="/archive/"], a[href*="archive/"]')
      );

      expect(
        candidates.length,
        "artifact must contain at least one <a> linking to an /archive/ permalink"
      ).toBeGreaterThan(0);

      const visible = candidates.filter((a) => isVisible(env.window, a));
      expect(
        visible.length,
        `${candidates.length} archive link(s) found, but all are hidden ` +
          `(display:none, visibility:hidden, or opacity:0). At least one must be visible.`
      ).toBeGreaterThan(0);

      const labeled = visible.filter((a) => hasLabel(a));
      expect(
        labeled.length,
        "at least one visible archive link must have non-empty text, aria-label, " +
          "or a labeled ancestor within 3 levels"
      ).toBeGreaterThan(0);
    }
  );
});

function isVisible(window, element) {
  const style = window.getComputedStyle(element);
  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  const opacity = parseFloat(style.opacity);
  if (!Number.isNaN(opacity) && opacity === 0) return false;
  return true;
}

function hasLabel(element) {
  if ((element.textContent || "").trim().length > 0) return true;
  if (element.getAttribute("aria-label")) return true;
  // Walk up to 3 ancestors looking for a label.
  let parent = element.parentElement;
  let depth = 0;
  while (parent && depth < 3) {
    if ((parent.textContent || "").trim().length > 0) return true;
    if (parent.getAttribute && parent.getAttribute("aria-label")) return true;
    parent = parent.parentElement;
    depth++;
  }
  return false;
}
