import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, "..", "..");

export function inlineScript(source, label = "inline-script.js") {
  return { source, label };
}

export function createBrowserEnv(options = {}) {
  const {
    url = "https://www.root.vc/",
    html = "<!doctype html><html><head></head><body></body></html>",
    globals = {},
  } = options;

  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: "dangerously",
    url,
  });
  const { window } = dom;

  window.console = console;
  Object.defineProperty(window.HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      return this.textContent || "";
    },
    set(value) {
      this.textContent = value;
    },
  });

  for (const [key, value] of Object.entries(globals)) {
    window[key] = value;
  }

  function loadScript(script) {
    let source;
    let label;

    if (typeof script === "string") {
      label = script;
      source = fs.readFileSync(path.join(REPO_ROOT, script), "utf8");
    } else {
      source = script.source;
      label = script.label || "inline-script.js";
    }

    const element = window.document.createElement("script");
    element.textContent = `${source}\n//# sourceURL=${label}`;
    window.document.head.appendChild(element);
    return element;
  }

  function loadScripts(scripts) {
    scripts.forEach((script) => loadScript(script));
    return window;
  }

  function exportValues(names, target = "__testExports") {
    const entries = names
      .map(
        (name) =>
          `${JSON.stringify(name)}: typeof ${name} === "undefined" ? undefined : ${name}`
      )
      .join(",\n");

    loadScript(
      inlineScript(`window.${target} = {${entries}};`, `${target}.js`)
    );

    return window[target];
  }

  function cleanup() {
    window.close();
  }

  return {
    cleanup,
    document: window.document,
    dom,
    exportValues,
    loadScript,
    loadScripts,
    window,
  };
}
