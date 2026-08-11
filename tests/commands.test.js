import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";

const jobsFixture = {
  1: ["Venture Capital Associate", "Job 1 body"],
  2: ["Platform Engineer", "Job 2 body"],
};

const baseGlobals = {
  _DIRS: { "~": [] },
  colorText: (text) => text,
  firm: {
    blurb: "Root Ventures",
    email: "jobs@root.vc",
  },
  help: {},
  jobs: jobsFixture,
  portfolio: {},
  team: {
    root: { name: "Root", title: "Team", linkedin: "", description: "" },
  },
};

let env;

function loadCommands(globals = {}) {
  env = createBrowserEnv({
    globals: {
      ...baseGlobals,
      ...globals,
    },
  });
  env.loadScripts(["config/commands.js"]);
  return env.exportValues(["commands"]);
}

function createTerm(overrides = {}) {
  return {
    clearCurrentLine: vi.fn(),
    collectInput: vi.fn(),
    command: vi.fn(),
    cols: 120,
    cwd: "~",
    displayURL: vi.fn(),
    locked: false,
    prompt: vi.fn(),
    stylePrint: vi.fn(),
    user: "guest",
    writeln: vi.fn(),
    ...overrides,
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
  vi.restoreAllMocks();
});

describe("commands.apply", () => {
  it("preserves apply 1 behavior and submits the first job title", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm({
      collectInput: vi
        .fn()
        .mockResolvedValueOnce("Test User")
        .mockResolvedValueOnce("test@example.com")
        .mockResolvedValueOnce("https://linkedin.com/in/test")
        .mockResolvedValueOnce("tester")
        .mockResolvedValueOnce("Because Root."),
    });

    env.window.term = term;

    expect(commands.apply(["1"])).toBe(1);
    expect(term.locked).toBe(true);

    await settle();

    expect(fetchMock).toHaveBeenCalledWith("/.netlify/functions/submit-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        linkedin: "https://linkedin.com/in/test",
        github: "tester",
        notes: "Because Root.",
        position: jobsFixture[1][0],
      }),
    });
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.clearCurrentLine).toHaveBeenCalledWith(true);
    expect(term.locked).toBe(false);
  });

  it("resolves job 2 from the registry and submits that job title", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm({
      collectInput: vi
        .fn()
        .mockResolvedValueOnce("Second User")
        .mockResolvedValueOnce("two@example.com")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("Built from registry."),
    });

    env.window.term = term;

    expect(commands.apply(["2"])).toBe(1);
    expect(term.locked).toBe(true);

    await settle();

    expect(fetchMock).toHaveBeenCalledWith("/.netlify/functions/submit-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second User",
        email: "two@example.com",
        linkedin: undefined,
        github: undefined,
        notes: "Built from registry.",
        position: jobsFixture[2][0],
      }),
    });
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.clearCurrentLine).toHaveBeenCalledWith(true);
    expect(term.locked).toBe(false);
  });

  it("keeps the existing missing job id error", () => {
    const fetchMock = vi.fn();
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm();

    env.window.term = term;

    expect(commands.apply([])).toBeUndefined();

    expect(term.stylePrint).toHaveBeenCalledWith(
      "Please provide a job id. Use %jobs% to list all current jobs."
    );
    expect(term.collectInput).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(term.locked).toBe(false);
  });

  it("keeps the existing unknown job id error", () => {
    const fetchMock = vi.fn();
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm();

    env.window.term = term;

    expect(commands.apply(["99"])).toBeUndefined();

    expect(term.stylePrint).toHaveBeenCalledWith(
      "Job id 99 not found. Use %jobs% to list all current jobs."
    );
    expect(term.collectInput).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(term.locked).toBe(false);
  });

  it("rejects inherited object keys without collecting input or submitting", () => {
    const fetchMock = vi.fn();
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm();

    env.window.term = term;

    expect(commands.apply(["__proto__"])).toBeUndefined();
    expect(commands.apply(["constructor"])).toBeUndefined();
    expect(commands.apply(["toString"])).toBeUndefined();

    expect(term.stylePrint).toHaveBeenNthCalledWith(
      1,
      "Job id __proto__ not found. Use %jobs% to list all current jobs."
    );
    expect(term.stylePrint).toHaveBeenNthCalledWith(
      2,
      "Job id constructor not found. Use %jobs% to list all current jobs."
    );
    expect(term.stylePrint).toHaveBeenNthCalledWith(
      3,
      "Job id toString not found. Use %jobs% to list all current jobs."
    );
    expect(term.collectInput).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(term.locked).toBe(false);
  });

  it("cancels cleanly without submitting when input collection is interrupted", async () => {
    const fetchMock = vi.fn();
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm({
      collectInput: vi.fn().mockResolvedValueOnce(null),
    });

    env.window.term = term;

    expect(commands.apply(["2"])).toBe(1);
    expect(term.locked).toBe(true);

    await settle();

    expect(term.stylePrint).toHaveBeenCalledWith("\r\nApplication cancelled.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.clearCurrentLine).toHaveBeenCalledWith(true);
    expect(term.locked).toBe(false);
  });

  it("reports server failures and restores terminal state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Server exploded" }),
    });
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm({
      collectInput: vi
        .fn()
        .mockResolvedValueOnce("Failure User")
        .mockResolvedValueOnce("fail@example.com")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("Please fail."),
    });

    env.window.term = term;

    expect(commands.apply(["1"])).toBe(1);

    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(term.stylePrint).toHaveBeenCalledWith(
      "\r\n✗ Error submitting application: Server exploded"
    );
    expect(term.stylePrint).toHaveBeenCalledWith(
      "\r\nPlease try again or email us directly at jobs@root.vc"
    );
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.clearCurrentLine).toHaveBeenCalledWith(true);
    expect(term.locked).toBe(false);
  });

  it("prints the existing success flow and restores terminal state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    const { commands } = loadCommands({ fetch: fetchMock });
    const term = createTerm({
      collectInput: vi
        .fn()
        .mockResolvedValueOnce("Success User")
        .mockResolvedValueOnce("success@example.com")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("Ship it."),
    });

    env.window.term = term;

    expect(commands.apply(["1"])).toBe(1);

    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(term.stylePrint).toHaveBeenCalledWith(
      "\r\n✓ Application submitted successfully!"
    );
    expect(term.stylePrint).toHaveBeenCalledWith(
      "\r\nThanks for applying! We'll review your application and get back to you soon."
    );
    expect(term.prompt).toHaveBeenCalledTimes(1);
    expect(term.clearCurrentLine).toHaveBeenCalledWith(true);
    expect(term.locked).toBe(false);
  });
});
