import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";
let env;
function setup(hash = "") {
  env = createBrowserEnv({
    html: '<div id="tui"></div>',
    url: "https://root.vc/" + hash,
  });
  env.window.HTMLElement.prototype.scrollIntoView = vi.fn();
  env.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  env.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  env.loadScripts([
    "config/firm.js",
    "config/portfolio.js",
    "config/team.js",
    "config/jobs.js",
    "js/tui.js",
  ]);
  return env.document;
}
function key(value, element = env.document.body) {
  element.dispatchEvent(
    new env.window.KeyboardEvent("keydown", {
      key: value,
      bubbles: true,
      cancelable: true,
    })
  );
}
afterEach(() => env?.cleanup());
describe("TUI directory", () => {
  it("preserves old portfolio and team deep links", () => {
    const doc = setup("#tldr-privacy_dynamics");
    expect(doc.querySelector("#detail h1").textContent).toBe(
      "Privacy Dynamics"
    );
    env.window.location.hash = "#whois-lee";
    env.window.dispatchEvent(new env.window.HashChangeEvent("hashchange"));
    expect(doc.querySelector("#detail h1").textContent).toBe("Lee Edwards");
  });
  it("filters, handles no matches, and restores results on Escape", () => {
    const doc = setup("#tldr");
    const input = doc.querySelector("#filter");
    input.value = "no-such-company-xyz";
    input.dispatchEvent(new env.window.Event("input", { bubbles: true }));
    expect(doc.querySelectorAll("[data-select]")).toHaveLength(0);
    expect(doc.querySelector("#detail").textContent).toContain(
      "Nothing selected"
    );
    key("Escape", doc.querySelector("#filter"));
    expect(doc.querySelectorAll("[data-select]").length).toBeGreaterThan(20);
  });
  it("browses with arrows and updates a shareable URL", () => {
    const doc = setup("#tldr");
    const second = doc.querySelectorAll("[data-select]")[1];
    key("ArrowDown");
    expect(doc.querySelector(".entry.selected").dataset.select).toBe(
      second.dataset.select
    );
    expect(env.window.location.hash).toBe("#tldr-" + second.dataset.select);
    expect(doc.activeElement.dataset.select).toBe(second.dataset.select);
  });
  it("does not treat typing as navigation shortcuts", () => {
    const doc = setup("#tldr");
    key("1", doc.querySelector("#filter"));
    expect(doc.querySelector(".collection")).not.toBeNull();
  });
  it("moves between menu, list, and details without changing selection", () => {
    const doc = setup("#whois-lee");
    const menu = doc.querySelector(".menu-item.selected");
    menu.focus();
    key("ArrowRight", menu);
    expect(doc.activeElement.dataset.select).toBe("lee");
    key("ArrowRight", doc.activeElement);
    expect(doc.activeElement.closest("#detail")).not.toBeNull();
    key("ArrowDown", doc.activeElement);
    expect(doc.querySelector(".entry.selected").dataset.select).toBe("lee");
    key("ArrowLeft", doc.activeElement);
    expect(doc.activeElement.dataset.select).toBe("lee");
    key("ArrowLeft", doc.activeElement);
    expect(doc.activeElement).toBe(menu);
  });
  it("scrolls a bio with arrows instead of repeatedly selecting its only link", () => {
    const doc = setup("#whois-lee");
    const detail = doc.querySelector("#detail");
    Object.defineProperties(detail, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 300 },
    });
    detail.focus();
    key("ArrowDown", detail);
    expect(detail.scrollTop).toBe(56);
    expect(doc.activeElement).toBe(detail);
    expect(detail.classList.contains("is-active")).toBe(true);
    expect(
      doc.querySelector('[data-focus-label="detail"]').textContent
    ).toContain("FOCUS");
    key("End", detail);
    expect(detail.scrollTop).toBe(700);
    key("ArrowDown", detail);
    expect(doc.activeElement).toBe(detail.querySelector("a"));
    key("ArrowUp", doc.activeElement);
    expect(doc.activeElement).toBe(detail);
    expect(detail.scrollTop).toBe(644);
    key("ArrowLeft", detail);
    expect(detail.classList.contains("is-active")).toBe(false);
    expect(doc.querySelector(".list-column.is-active")).not.toBeNull();
  });
  it("keeps cursor keys native in search fields", () => {
    const doc = setup("#tldr");
    const input = doc.querySelector("#filter");
    input.focus();
    key("ArrowRight", input);
    expect(doc.activeElement).toBe(input);
  });
  it("uses ASCII photos and offers exit instead of app launchers", () => {
    const doc = setup("#whois-lee");
    expect(doc.querySelector("[data-art]").dataset.art).toBe("images/lee.png");
    expect(doc.querySelector("#detail img")).toBeNull();
    expect(doc.querySelector("[data-launch]")).toBeNull();
    expect(doc.querySelector("[data-exit]")).not.toBeNull();
    expect(doc.body.textContent).not.toContain("Human conviction");
  });
  it("converts transparent, dark, and light pixels to text", () => {
    setup();
    env.loadScript("js/tui-art.js");
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0,
    ]);
    expect(env.window.rootAscii.fromPixels(pixels, 3, 1)).toBe("@  ");
  });
  it("reaches every overview action using arrow keys", () => {
    const doc = setup();
    const menu = doc.querySelector(".menu-item.selected");
    menu.focus();
    key("ArrowRight", menu);
    expect(doc.activeElement.dataset.go).toBe("portfolio");
    key("ArrowDown", doc.activeElement);
    expect(doc.activeElement.dataset.go).toBe("team");
    key("End", doc.activeElement);
    expect(doc.activeElement.dataset.go).toBe("contact");
    key("Home", doc.activeElement);
    expect(doc.activeElement.dataset.go).toBe("portfolio");
    key("ArrowLeft", doc.activeElement);
    expect(doc.activeElement).toBe(menu);
  });
  it("arrows through every contact link and appearance control", () => {
    const doc = setup("#contact");
    key("ArrowRight");
    const links = [...doc.querySelectorAll(".content-scroll a")];
    for (const link of links) {
      expect(doc.activeElement).toBe(link);
      key("ArrowDown", doc.activeElement);
    }
    expect(doc.activeElement).toBe(links[0]);
    env.window.location.hash = "#settings";
    env.window.dispatchEvent(new env.window.HashChangeEvent("hashchange"));
    const themes = [...doc.querySelectorAll("[data-theme]")];
    for (const theme of themes) {
      expect(doc.activeElement).toBe(theme);
      key("ArrowDown", doc.activeElement);
    }
  });
  it("moves from search to its result using ArrowDown", () => {
    const doc = setup("#whois-lee");
    const input = doc.querySelector("#filter");
    input.focus();
    key("ArrowDown", input);
    expect(doc.activeElement.dataset.select).toBe("lee");
  });
  it("retains theme preference and applies it", () => {
    const doc = setup("#settings");
    doc.querySelector("[data-theme=paper]").click();
    expect(env.window.localStorage.getItem("root-tui-theme")).toBe("paper");
    expect(doc.documentElement.style.colorScheme).toBe("light");
    expect(
      doc.querySelector("[data-theme=paper]").getAttribute("aria-pressed")
    ).toBe("true");
  });
  it("keeps keyboard focus inside the application dialog and supports Escape", () => {
    const doc = setup("#apply-1");
    const submit = doc.querySelector("[type=submit]");
    submit.focus();
    key("Tab", submit);
    expect(doc.activeElement).toBe(doc.querySelector("[data-close]"));
    key("Tab", doc.activeElement);
    expect(doc.activeElement.name).toBe("name");
    key("Escape", doc.activeElement);
    expect(doc.querySelector("dialog").open).toBe(false);
  });
  it("keeps failed application input and permits retry without duplicate submissions", async () => {
    const doc = setup("#apply-1");
    let resolve;
    env.window.fetch = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const form = doc.querySelector("form");
    form.querySelector("[name=name]").value = "Test Person";
    form.querySelector("[name=email]").value = "test@example.com";
    const submit = () =>
      form.dispatchEvent(
        new env.window.Event("submit", { bubbles: true, cancelable: true })
      );
    submit();
    submit();
    expect(env.window.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(env.window.fetch.mock.calls[0][1].body).position).toBe(
      "Venture Capital Associate"
    );
    resolve({ ok: false });
    await new Promise((r) => setTimeout(r, 0));
    expect(form.querySelector("[name=name]").value).toBe("Test Person");
    expect(form.querySelector("[type=submit]").disabled).toBe(false);
    env.window.fetch.mockResolvedValue({ ok: true });
    submit();
    await new Promise((r) => setTimeout(r, 0));
    expect(form.textContent).toContain("Application received");
  });
});
