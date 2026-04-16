import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";

let env;

function loadFs(globals = {}) {
  env = createBrowserEnv({
    html: `
      <!doctype html>
      <html>
        <head></head>
        <body>
          <div id="files-all"></div>
        </body>
      </html>
    `,
    globals: {
      fetch: vi.fn(async () => ({
        text: async () => "remote body",
      })),
      team: { lee: { name: "Lee" } },
      ...globals,
    },
  });
  env.loadScripts(["config/fs.js"]);
  return env.exportValues([
    "_insertFileToDOM",
    "_loadFile",
    "ensureFileLoaded",
    "getFileContents",
    "getPreloadFileForCommand",
  ]);
}

afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
});

describe("virtual fs", () => {
  it("deduplicates concurrent remote file loads", async () => {
    const { _loadFile } = loadFs();

    const first = _loadFile("README.md");
    const second = _loadFile("README.md");

    expect(first).toBe(second);

    await Promise.all([first, second]);

    expect(env.window.fetch).toHaveBeenCalledTimes(1);
    expect(env.document.getElementById("README.md")).not.toBeNull();
  });

  it("loads local files synchronously without fetching", async () => {
    const { ensureFileLoaded, getFileContents } = loadFs();

    await ensureFileLoaded("id_rsa");

    expect(env.window.fetch).not.toHaveBeenCalled();
    expect(getFileContents("id_rsa")).toBe("Nice try!");
  });

  it("reuses existing DOM nodes when inserting file contents", () => {
    const { _insertFileToDOM } = loadFs();

    _insertFileToDOM("README.md", "first");
    _insertFileToDOM("README.md", "second");

    expect(env.document.querySelectorAll("#README\\.md")).toHaveLength(1);
    expect(env.document.getElementById("README.md").innerText).toBe("second");
  });

  it("preloads only remote files for cat and grep", () => {
    const { getPreloadFileForCommand } = loadFs();

    expect(getPreloadFileForCommand("cat", ["README.md"])).toBe("README.md");
    expect(getPreloadFileForCommand("grep", ["welcome.htm"])).toBe(
      "welcome.htm"
    );
    expect(getPreloadFileForCommand("cat", ["id_rsa"])).toBeNull();
    expect(getPreloadFileForCommand("open", ["README.md"])).toBeNull();
  });

  it("returns a loading message for remote files that have not landed yet", () => {
    const { getFileContents } = loadFs();

    expect(getFileContents("README.md")).toBe(
      "Loading README.md. Try again in a moment."
    );
    expect(env.window.fetch).toHaveBeenCalledTimes(1);
  });
});
