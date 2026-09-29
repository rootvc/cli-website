import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";
let env;
afterEach(() => env?.cleanup());
describe("CLI TUI command host", () => {
  it("starts on demand, deduplicates launches, validates exit messages, and restores focus", () => {
    const term = { focus: vi.fn() };
    const fitAddon = { fit: vi.fn() };
    env = createBrowserEnv({
      html: '<div id="terminal"></div>',
      globals: { term, fitAddon },
    });
    env.loadScript("js/tui-launcher.js");
    expect(env.document.querySelector("iframe")).toBeNull();
    env.window.openRootTui();
    const frame = env.document.querySelector("iframe");
    expect(frame.getAttribute("src")).toBe("/tui.html");
    expect(env.document.querySelector("#terminal").inert).toBe(true);
    env.window.openRootTui();
    expect(env.document.querySelectorAll("iframe")).toHaveLength(1);
    const send = (origin, source) =>
      env.window.dispatchEvent(
        new env.window.MessageEvent("message", {
          origin,
          source,
          data: { type: "root-tui-exit" },
        })
      );
    send("https://untrusted.example", frame.contentWindow);
    send(env.window.location.origin, env.window);
    expect(env.window.rootTui.active).toBe(true);
    send(env.window.location.origin, frame.contentWindow);
    expect(env.document.querySelector("iframe")).toBeNull();
    expect(env.window.rootTui.active).toBe(false);
    expect(env.document.querySelector("#terminal").inert).toBe(false);
    expect(term.focus).toHaveBeenCalledOnce();
    expect(fitAddon.fit).toHaveBeenCalledOnce();
  });
});
