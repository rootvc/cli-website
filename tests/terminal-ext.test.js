import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";

let env;

function loadTerminalExt(globals = {}) {
  env = createBrowserEnv({
    globals: {
      LOGO_TYPE: "ROOT",
      colorText: (text) => text,
      commands: { help: vi.fn() },
      ensureASCIIArt: vi.fn(() => Promise.resolve()),
      ensureFileLoaded: vi.fn(() => Promise.resolve()),
      fitAddon: { fit: vi.fn() },
      getASCIIArtIdForCommand: vi.fn(() => null),
      getArt: vi.fn(() => ""),
      getPreloadFileForCommand: vi.fn(() => null),
      jobs: {},
      preloadASCIIArt: vi.fn(() => Promise.resolve()),
      scheduleIdleTask: vi.fn((task) => task()),
      ...globals,
    },
  });
  env.loadScripts(["js/terminal-ext.js"]);
  return env.exportValues(["extend"]);
}

function createTerm(overrides = {}) {
  const term = {
    VERSION: 4,
    _core: { buffer: { x: 0 } },
    cols: 80,
    command: vi.fn(() => 0),
    currentLine: "",
    focus: vi.fn(),
    history: [],
    loadAddon: vi.fn(),
    open: vi.fn(),
    reset: vi.fn(),
    scrollToBottom: vi.fn(),
    write: vi.fn(),
    writeln: vi.fn(),
  };

  return Object.assign(term, overrides);
}

afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
});

describe("terminal-ext", () => {
  it("normalizes preload-only aliases before resolving assets", async () => {
    const { extend } = loadTerminalExt({
      getASCIIArtIdForCommand: vi.fn(() => "lee"),
      getPreloadFileForCommand: vi.fn(() => "README.md"),
    });
    const term = createTerm();

    extend(term);
    await term.preloadCommandAssets("open README.md");

    expect(term.normalizeCommandForPreload("open", ["README.md"])).toEqual({
      args: ["README.md"],
      cmd: "cat",
    });
    expect(term.normalizeCommandForPreload("open", ["welcome.htm"])).toEqual({
      args: ["welcome.htm"],
      cmd: "open",
    });
    expect(env.window.getASCIIArtIdForCommand).toHaveBeenCalledWith("cat", [
      "README.md",
    ]);
    expect(env.window.getPreloadFileForCommand).toHaveBeenCalledWith("cat", [
      "README.md",
    ]);
    expect(env.window.ensureASCIIArt).toHaveBeenCalledWith("lee");
    expect(env.window.ensureFileLoaded).toHaveBeenCalledWith("README.md");
  });

  it("waits for asset preloading before dispatching a command", async () => {
    const { extend } = loadTerminalExt();
    const term = createTerm();
    const order = [];

    extend(term);
    term.preloadCommandAssets = vi.fn(async () => {
      order.push("preload");
    });
    term.command = vi.fn(() => {
      order.push("command");
      return 0;
    });

    await term.executeCommandLine("help");

    expect(order).toEqual(["preload", "command"]);
    expect(term.history).toEqual(["help"]);
    expect(env.window.dataLayer).toEqual([
      { args: "", command: "help", event: "commandSent" },
    ]);
    expect(term.busy).toBe(false);
    expect(term.command).toHaveBeenCalledWith("help");
  });

  it("routes deep links through executeCommandLine without double prompts", () => {
    const { extend } = loadTerminalExt();
    const term = createTerm();

    extend(term);
    term.deepLink = "whois lee";
    term.executeCommandLine = vi.fn(() => Promise.resolve());
    term.runDeepLink();

    expect(term.executeCommandLine).toHaveBeenCalledWith("whois lee", {
      addToHistory: false,
      promptAfter: false,
      showLeadingNewline: false,
      // Deep links are the only way to address a specific company or person
      // now, and a fragment fires no pageview of its own, so these arrivals
      // would otherwise be invisible in analytics.
      trackAnalytics: true,
    });
  });

  it("does not re-count a deep link when a resize replays it", () => {
    // xterm clears its buffer on resize, so resizeListener reruns the deep link
    // to redraw the output. That is the same visit — counting it again inflates
    // every deep-link arrival by one per resize, and mobile browsers fire
    // resize just from showing and hiding the address bar.
    const { extend } = loadTerminalExt();
    const term = createTerm();

    extend(term);
    term.deepLink = "whois lee";
    term.executeCommandLine = vi.fn(() => Promise.resolve());
    term.runDeepLink({ replay: true });

    expect(term.executeCommandLine).toHaveBeenCalledWith(
      "whois lee",
      expect.objectContaining({ trackAnalytics: false })
    );
  });

  it.each([
    ["#jobs", "jobs"],
    ["#whois-root", "whois root"],
    ["#tldr-chargelab", "tldr chargelab"],
    // The one that used to break: splitting on every hyphen turned a
    // hyphenated slug into two arguments, so the company's own deep link
    // missed. Only the first hyphen separates command from argument.
    ["#tldr-vibe-robotics", "tldr vibe-robotics"],
    ["", ""],
  ])("parses %s into the command %s", (hash, expected) => {
    const { extend } = loadTerminalExt();
    env.window.location.hash = hash;
    const term = createTerm();

    extend(term);

    expect(term.deepLink).toBe(expected);
  });

  it("prints cached art immediately and falls back to loading on cache miss", () => {
    const { extend } = loadTerminalExt({
      getArt: vi.fn()
        .mockReturnValueOnce("ASCII")
        .mockReturnValueOnce(""),
    });
    const term = createTerm();

    extend(term);
    term.printArt("lee");
    term.printArt("rootvc-square");

    expect(term.writeln).toHaveBeenCalledWith("\r\nASCII\r\n");
    expect(env.window.ensureASCIIArt).toHaveBeenCalledWith("rootvc-square");
  });
});
