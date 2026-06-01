import { afterEach, describe, expect, it } from "vitest";
import { createBrowserEnv } from "./helpers/browser-env";

let env;

function loadGame(globals = {}) {
  env = createBrowserEnv({
    globals: {
      commands: {
        help: () => {},
        game: () => {},
        locate: () => {},
      },
      help: {
        "%game%": "play Root Router",
        "%locate%": "physical address",
      },
      portfolio: {
        particle: {
          name: "Particle",
          description: "Particle is the largest professional IoT development platform.",
        },
      },
      team: {
        lee: {
          name: "Lee Edwards",
          title: "Partner",
          description: "Lee was most recently CTO at Teespring. He likes systems.",
        },
      },
      whoisRoot: "Root Ventures is a San Francisco-based deep tech seed fund. Try whois.",
      ...globals,
    },
  });
  env.loadScripts(["js/game.js"]);
  return env.window.RootRouter;
}

function gameMarkup() {
  return `
    <!doctype html>
    <html>
      <head></head>
      <body>
        <main data-root-router>
          <button data-back></button>
          <strong data-score></strong>
          <strong data-left></strong>
          <strong data-streak></strong>
          <article data-card>
            <span data-packet-type></span>
            <h1 data-packet-title></h1>
            <p data-packet-clue></p>
            <div data-packet-chips></div>
            <img data-packet-image />
            <div data-packet-terminal></div>
          </article>
          <div data-feedback></div>
          <section data-start-screen></section>
          <section data-end-screen></section>
          <strong data-end-score></strong>
          <strong data-end-best></strong>
          <button data-lane="cli"></button>
          <button data-lane="portfolio"></button>
          <button data-lane="team"></button>
          <button data-lane="geo"></button>
          <button data-start></button>
        </main>
      </body>
    </html>
  `;
}

afterEach(() => {
  if (env) {
    env.cleanup();
    env = null;
  }
});

describe("Root Router game data", () => {
  it("builds packets from terminal, portfolio, team, and GeoCities sources", () => {
    const game = loadGame();
    const deck = game.buildDeck(env.window);
    const lanes = new Set(deck.map((packet) => packet.lane));
    const titles = deck.map((packet) => packet.title);

    expect(lanes).toEqual(new Set(["cli", "portfolio", "team", "geo"]));
    expect(titles).toContain("Particle");
    expect(titles).toContain("Lee Edwards");
    expect(titles).toContain("game");
    expect(titles).toContain("construction.gif");
  });

  it("keeps useful terminal hints on each packet", () => {
    const game = loadGame();
    const deck = game.buildDeck(env.window);

    expect(deck.every((packet) => packet.terminal.length > 0)).toBe(true);
    expect(deck.every((packet) => packet.chips.length > 0)).toBe(true);
  });

  it("reads repo config constants when mounted like game.html", () => {
    env = createBrowserEnv({ html: gameMarkup() });
    env.loadScripts([
      "config/help.js",
      "config/portfolio.js",
      "config/team.js",
      "config/commands.js",
      "js/game.js",
    ]);

    const game = env.window.RootRouter.createGame(
      env.document.querySelector("[data-root-router]")
    );
    const lanes = new Set(game.state.deck.map((packet) => packet.lane));

    expect(game.state.deck).toHaveLength(18);
    expect(lanes).toEqual(new Set(["cli", "portfolio", "team", "geo"]));
  });
});
