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
    busy: false,
    locked: false,
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

  term.onData = vi.fn((handler) => {
    term._inputHandler = handler;
    return {
      dispose: vi.fn(() => {
        if (term._inputHandler === handler) {
          term._inputHandler = null;
        }
      }),
    };
  });

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

  it("stops an async command at its next primitive await and restores the prompt", async () => {
    vi.useFakeTimers();
    let term;
    const { extend } = loadTerminalExt({
      commands: {
        animate: async () => {
          term.write("before");
          await term.delayPrint("middle", 10);
          await term.delayStylePrint("late", 100);
        },
      },
    });
    term = createTerm();
    extend(term);
    vi.spyOn(term, "prompt");

    const command = term.executeCommandLine("animate");
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(10);
    expect(term.write).toHaveBeenCalledWith("middle");

    term._requestInterrupt();
    term._requestInterrupt();
    await command;

    expect(term.write).toHaveBeenCalledWith("before");
    expect(term.write).toHaveBeenCalledWith("middle");
    expect(term.write).toHaveBeenCalledWith("\r\n");
    expect(term.writeln).toHaveBeenCalledWith("^C");
    expect(
      term.write.mock.invocationCallOrder.find(
        (callOrder, index) => term.write.mock.calls[index][0] === "\r\n"
      )
    ).toBeLessThan(term.writeln.mock.invocationCallOrder[term.writeln.mock.calls.findIndex(([value]) => value === "^C")]);
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.prompt.mock.invocationCallOrder[0]).toBeGreaterThan(
      term.writeln.mock.invocationCallOrder[term.writeln.mock.calls.findIndex(([value]) => value === "^C")]
    );
    expect(term.writeln).not.toHaveBeenCalledWith("late");
    expect(term.busy).toBe(false);
    expect(term.locked).toBe(false);
    vi.useRealTimers();
  });

  it("unlocks an interrupted command without rolling back completed mutations", async () => {
    vi.useFakeTimers();
    let term;
    const { extend } = loadTerminalExt({
      commands: {
        mutate: async () => {
          term.VERSION = 9;
          term.locked = true;
          await term.delayPrint("never", 100);
        },
      },
    });
    term = createTerm();
    extend(term);

    const command = term.executeCommandLine("mutate");
    await Promise.resolve();
    await Promise.resolve();
    term._requestInterrupt();
    await command;

    expect(term.VERSION).toBe(9);
    expect(term.locked).toBe(false);
    expect(term.busy).toBe(false);
    expect(term.writeln).toHaveBeenCalledWith("^C");
    vi.useRealTimers();
  });

  it("accepts the next command after an interrupted command settles", async () => {
    vi.useFakeTimers();
    let term;
    const { extend } = loadTerminalExt({
      commands: {
        interruptible: async () => {
          await term.delayPrint("not-after-interrupt", 100);
        },
        next: () => {
          term.write("next-command");
        },
      },
    });
    term = createTerm();
    extend(term);

    const interrupted = term.executeCommandLine("interruptible");
    await Promise.resolve();
    await Promise.resolve();
    term._requestInterrupt();
    await interrupted;

    await term.executeCommandLine("next");

    expect(term.write).toHaveBeenCalledWith("next-command");
    expect(term.busy).toBe(false);
    expect(term.locked).toBe(false);
    vi.useRealTimers();
  });

  it.each(["delayPrint", "delayStylePrint", "dottedPrint", "progressBar"])(
    "%s rejects its pending wait with the private abort error",
    async (primitive) => {
      vi.useFakeTimers();
      let term;
      const { extend } = loadTerminalExt({
        commands: {
          probe: async () => {
            try {
              if (primitive === "delayPrint") {
                await term.delayPrint("late", 100);
              } else if (primitive === "delayStylePrint") {
                await term.delayStylePrint("late", 100);
              } else if (primitive === "dottedPrint") {
                await term.dottedPrint("dots", 1);
              } else {
                await term.progressBar(100, "progress");
              }
            } catch (error) {
              term.caughtAbort = error;
              throw error;
            }
          },
        },
      });
      term = createTerm();
      extend(term);

      const command = term.executeCommandLine("probe");
      await Promise.resolve();
      await Promise.resolve();
      term._requestInterrupt();
      await command;

      expect(term.caughtAbort).toMatchObject({ _terminalAbort: true });
      expect(term.busy).toBe(false);
      expect(term.locked).toBe(false);
      vi.useRealTimers();
    }
  );

  it("keeps collectInput Ctrl+C single-fire and exclusive", async () => {
    const { extend } = loadTerminalExt();
    const term = createTerm();
    extend(term);

    const input = term.collectInput("Name");
    const inputHandler = term._inputHandler;
    inputHandler("\u0003");
    inputHandler("\u0003");

    await expect(input).resolves.toBe(null);
    expect(term.locked).toBe(false);
    expect(term._collectingInput).toBe(false);
    expect(term.write).toHaveBeenCalledWith("^C\r\n");
    expect(term.write.mock.calls.filter(([value]) => value === "^C\r\n")).toHaveLength(1);
  });

  it("preserves a non-interrupt command failure instead of printing Ctrl+C", async () => {
    const error = new Error("boom");
    let term;
    const { extend } = loadTerminalExt({
      commands: {
        fail: () => Promise.reject(error),
      },
    });
    term = createTerm();
    extend(term);

    await term.executeCommandLine("fail");

    expect(term.writeln).not.toHaveBeenCalledWith("^C");
    expect(term.busy).toBe(false);
    expect(term.locked).toBe(false);
  });

  it("awaits a complete, non-interruptible resize replay", async () => {
    vi.useFakeTimers();
    let term;
    const { extend } = loadTerminalExt({
      commands: {
        replay: async () => {
          term.write("replay-start");
          await term.delayPrint("replay-end", 25);
        },
      },
    });
    term = createTerm();
    extend(term);
    term.history = ["replay"];

    const replay = term.resizeListener();
    expect(term._replaying).toBe(true);
    term._requestInterrupt();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(25);
    await replay;

    expect(term.write).toHaveBeenCalledWith("replay-end");
    expect(term._replaying).toBe(false);
    expect(term.busy).toBe(false);
    expect(term.locked).toBe(false);
    vi.useRealTimers();
  });

  it("joins overlapping resize requests so stale replay cleanup cannot release ownership", async () => {
    vi.useFakeTimers();
    let term;
    const { extend } = loadTerminalExt({
      commands: {
        replay: async () => {
          await term.delayPrint("replay-end", 25);
        },
      },
    });
    term = createTerm();
    extend(term);
    term.history = ["replay"];

    const firstReplay = term.resizeListener();
    const joinedReplay = term.resizeListener();

    expect(joinedReplay).toBe(firstReplay);
    expect(term._replaying).toBe(true);
    expect(term.busy).toBe(true);
    expect(term._requestInterrupt()).toBe(false);
    expect(term._replaying).toBe(true);
    expect(term.busy).toBe(true);

    await vi.advanceTimersByTimeAsync(25);
    await firstReplay;

    expect(term._replaying).toBe(false);
    expect(term.busy).toBe(false);
    expect(term._replayPromise).toBe(null);
    vi.useRealTimers();
  });
});
