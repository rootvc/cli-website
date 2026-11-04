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
    buffer: { active: { cursorX: 0 } },
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
  // Simulates fitAddon.fit() changing the column count on the next resize.
  function fitTo(cols) {
    env.window.fitAddon.fit.mockImplementation(() => {
      env.window.__term.cols = cols;
    });
  }

  it("does not reopen the TUI when resizing replays CLI history or deep links", () => {
    const launch = vi.fn();
    const { extend } = loadTerminalExt({ commands: { tui: launch } });
    const term = createTerm(); extend(term);
    env.window.__term = term;
    fitTo(120);
    term.history = ['tui'];
    term.deepLink = 'tui';
    term.init = vi.fn(); term.prompt = vi.fn();
    term.resizeListener();
    expect(launch).not.toHaveBeenCalled();
    expect(term.prompt).toHaveBeenCalled();
  });

  it("replays history only when the column count changes", () => {
    // Phone keyboards and collapsing address bars fire resize with the same
    // width. xterm keeps its buffer in that case, so wiping and redrawing the
    // session was pure disruption.
    const whois = vi.fn();
    const { extend } = loadTerminalExt({ commands: { whois } });
    const term = createTerm();
    env.window.__term = term;
    extend(term); // resets history, so it is set afterwards
    term.history = ["whois lee"];
    term.init = vi.fn();
    term.prompt = vi.fn();

    term.resizeListener(); // fit leaves cols at 80
    expect(term.init).not.toHaveBeenCalled();
    expect(whois).not.toHaveBeenCalled();
    expect(term.scrollToBottom).toHaveBeenCalled();

    fitTo(40);
    term.resizeListener();
    expect(term.init).toHaveBeenCalledWith("guest", true);
    expect(whois).toHaveBeenCalledWith(["lee"]);
  });

  it("echoes but does not rerun animated or interactive commands on replay", () => {
    // `upgrade` locks the terminal for its whole animation and `apply` opens a
    // form; replaying either on a window resize was hostile.
    const commands = Object.fromEntries(
      ["upgrade", "apply", "test", "claude", "whois"].map((name) => [name, vi.fn()])
    );
    const { extend } = loadTerminalExt({ commands });
    const term = createTerm();
    env.window.__term = term;
    extend(term);
    term.history = ["upgrade", "apply 1", "test", "claude", "whois lee"];
    fitTo(40);
    term.init = vi.fn();
    term.prompt = vi.fn();

    term.resizeListener();

    for (const name of ["upgrade", "apply", "test", "claude"]) {
      expect(commands[name]).not.toHaveBeenCalled();
    }
    expect(commands.whois).toHaveBeenCalledWith(["lee"]);
    // Every line is still echoed so the transcript reads as it did.
    const echoed = term.prompt.mock.calls.map((c) => c[1]).filter(Boolean);
    expect(echoed).toEqual(expect.arrayContaining([" upgrade\r\n", " apply 1\r\n"]));
  });

  it("does not rerun an interactive deep link when a resize replays it", () => {
    // Job posts link to /#apply-1. Deep links are not in history, so the
    // NO_REPLAY check on history alone let a resize start a second form whose
    // input listener stacked on the first: every keystroke echoed twice.
    const commands = Object.fromEntries(
      ["upgrade", "apply", "test", "claude"].map((name) => [name, vi.fn()])
    );
    const { extend } = loadTerminalExt({ commands });
    const term = createTerm({ command: vi.fn() });
    env.window.__term = term;
    extend(term);
    term.init = vi.fn();
    term.prompt = vi.fn();
    term.executeCommandLine = vi.fn(() => Promise.resolve());

    for (const line of ["apply 1", "upgrade", "test", "claude"]) {
      term.deepLink = line;
      term.runDeepLink({ replay: true });
    }

    expect(term.executeCommandLine).not.toHaveBeenCalled();
  });

  it("redraws the pending form question, not a shell prompt, after a resize", () => {
    // A resize wipes the screen while apply's collectInput still owns the
    // keyboard. Redrawing a shell prompt there made it look like the form was
    // gone while keystrokes kept landing in the name field.
    const { extend } = loadTerminalExt();
    let onData;
    const term = createTerm({
      onData: vi.fn((handler) => {
        onData = handler;
        return { dispose: vi.fn() };
      }),
    });
    env.window.__term = term;
    extend(term);
    term.init = vi.fn();
    term.prompt = vi.fn();

    const answer = term.collectInput("What's your name?");
    for (const ch of "Jane") onData(ch);
    fitTo(40);
    term.write.mockClear();
    term.resizeListener();

    expect(term.prompt).not.toHaveBeenCalledWith();
    expect(term.write).toHaveBeenLastCalledWith("\r\nWhat's your name?: Jane");

    // Once answered, resizes go back to drawing the normal prompt.
    onData("\r");
    return answer.then((value) => {
      expect(value).toBe("Jane");
      fitTo(60);
      term.resizeListener();
      expect(term.prompt).toHaveBeenLastCalledWith();
    });
  });

  it("reads the cursor through xterm's public buffer API", () => {
    const { extend } = loadTerminalExt();
    const term = createTerm({ buffer: { active: { cursorX: 25 } } });
    extend(term);
    // prompt is "guest:rootpc ~ $" (16 chars) plus the space.
    expect(term.pos()).toBe(25 - "guest:rootpc ~ $".length - 1);
  });

  it("colorizes every %command% token in a line with one pass", () => {
    const { extend } = loadTerminalExt({
      commands: { help: vi.fn(), whois: vi.fn(), "c.d": vi.fn() },
      colorText: (text, color) => (color === "command" ? `[${text}]` : text),
    });
    const term = createTerm();
    extend(term);
    term.stylePrint("Try %whois% or %help%; %nope% stays; %c.d% is escaped, %cxd% is not");
    expect(term.writeln).toHaveBeenCalledWith(
      "Try [whois] or [help]; %nope% stays; [c.d] is escaped, %cxd% is not"
    );
  });
  it("fits without resetting the retained CLI while the TUI is active", () => {
    const { extend } = loadTerminalExt({rootTui:{active:true}});
    const term = createTerm(); extend(term);
    term.init = vi.fn();
    term.resizeListener();
    expect(env.window.fitAddon.fit).toHaveBeenCalledOnce();
    expect(term.init).not.toHaveBeenCalled();
  });
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
