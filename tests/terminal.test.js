import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";

const baseGlobals = {
  _DIRS: { "~": [] },
  _filesHere: () => [],
  commands: { help: () => {} },
  portfolio: {},
  team: {},
};

let env;

function loadTerminalScript(globals = {}) {
  env = createBrowserEnv({
    globals: {
      ...baseGlobals,
      ...globals,
    },
  });
  env.loadScripts(["js/terminal.js"]);
  return env.exportValues(["runRootTerminal"]);
}

function createTerm(overrides = {}) {
  const term = {
    _initialized: false,
    busy: false,
    clearCurrentLine: vi.fn(),
    currentLine: "",
    executeCommandLine: vi.fn(),
    history: [],
    historyCursor: -1,
    init: vi.fn(),
    locked: false,
    pos: vi.fn(() => 0),
    prompt: vi.fn(),
    resizeListener: vi.fn(),
    runDeepLink: vi.fn(),
    scrollToBottom: vi.fn(),
    setCurrentLine: vi.fn((line) => {
      term.currentLine = line;
    }),
    tabBase: "",
    tabIndex: 0,
    tabOptions: [],
    write: vi.fn(),
  };

  term.onData = vi.fn((handler) => {
    term._onData = handler;
    return { dispose: vi.fn() };
  });

  return Object.assign(term, overrides);
}

afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
});

describe("runRootTerminal", () => {
  it("initializes once and prompts immediately", () => {
    const { runRootTerminal } = loadTerminalScript();
    const term = createTerm();

    runRootTerminal(term);

    expect(term.init).toHaveBeenCalledTimes(1);
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.runDeepLink).toHaveBeenCalledTimes(1);
    expect(term.onData).toHaveBeenCalledTimes(1);
    expect(term._initialized).toBe(true);
  });

  it("sends the current line through executeCommandLine on Enter", () => {
    const { runRootTerminal } = loadTerminalScript();
    const term = createTerm({
      currentLine: "help",
      tabBase: "hel",
      tabIndex: 2,
      tabOptions: ["help"],
    });

    runRootTerminal(term);
    term._onData("\r");

    expect(term.executeCommandLine).toHaveBeenCalledWith("help");
    expect(term.tabBase).toBe("");
    expect(term.tabIndex).toBe(0);
    expect(term.tabOptions).toEqual([]);
    expect(term.scrollToBottom).toHaveBeenCalled();
  });

  it("debounces resize handling with requestAnimationFrame", () => {
    const rafCallbacks = [];
    const requestAnimationFrame = vi.fn((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    const { runRootTerminal } = loadTerminalScript({ requestAnimationFrame });
    const term = createTerm();

    runRootTerminal(term);
    env.window.dispatchEvent(new env.window.Event("resize"));
    env.window.dispatchEvent(new env.window.Event("resize"));

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(term.resizeListener).not.toHaveBeenCalled();

    rafCallbacks[0]();

    expect(term.resizeListener).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the terminal is already initialized", () => {
    const { runRootTerminal } = loadTerminalScript();
    const term = createTerm({ _initialized: true });

    runRootTerminal(term);

    expect(term.init).not.toHaveBeenCalled();
    expect(term.prompt).not.toHaveBeenCalled();
    expect(term.onData).not.toHaveBeenCalled();
  });
});
