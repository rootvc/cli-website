import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";

let env;

function loadAsciiArt(globals = {}) {
  env = createBrowserEnv({
    html: `
      <!doctype html>
      <html>
        <head></head>
        <body>
          <div id="aa-all"></div>
        </body>
      </html>
    `,
    globals: {
      ensureAALibLoaded: vi.fn(() => Promise.resolve()),
      portfolio: { esper: { name: "Esper" } },
      scheduleIdleTask: vi.fn((task) => task()),
      team: { lee: { name: "Lee" } },
      term: { cols: 80 },
      ...globals,
    },
  });
  env.loadScripts(["js/ascii-art.js"]);
  return env.exportValues([
    "ensureASCIIArt",
    "getArt",
    "getASCIIArtIdForCommand",
    "isASCIIArtLoaded",
    "preloadASCIIArt",
  ]);
}

afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
});

describe("ascii-art", () => {
  it("maps commands to their preloadable ASCII art ids", () => {
    const { getASCIIArtIdForCommand } = loadAsciiArt();

    expect(getASCIIArtIdForCommand("whois", ["root"])).toBe("rootvc-square");
    expect(getASCIIArtIdForCommand("whois", ["lee"])).toBe("lee");
    expect(getASCIIArtIdForCommand("tldr", ["esper"])).toBe("esper");

    env.window.term.cols = 39;
    expect(getASCIIArtIdForCommand("whois", ["lee"])).toBeNull();

    env.window.term.cols = 59;
    expect(getASCIIArtIdForCommand("tldr", ["esper"])).toBeNull();
  });

  it("deduplicates concurrent art loads and marks the art as loaded", async () => {
    const { ensureASCIIArt, getArt, isASCIIArtLoaded } = loadAsciiArt({
      term: { cols: 30 },
    });

    const first = ensureASCIIArt("lee");
    const second = ensureASCIIArt("lee");

    expect(first).toBe(second);

    await Promise.all([first, second]);

    expect(env.window.ensureAALibLoaded).toHaveBeenCalledTimes(1);
    expect(isASCIIArtLoaded("lee")).toBe(true);
    expect(getArt("lee")).toContain("images/lee.png");
  });

  it("preloads root, team, and portfolio art in idle batches", async () => {
    const { preloadASCIIArt, isASCIIArtLoaded } = loadAsciiArt({
      term: { cols: 30 },
    });

    await preloadASCIIArt();

    expect(isASCIIArtLoaded("rootvc-square")).toBe(true);
    expect(isASCIIArtLoaded("lee")).toBe(true);
    expect(isASCIIArtLoaded("esper")).toBe(true);
    expect(env.window.scheduleIdleTask).toHaveBeenCalled();
  });
});
