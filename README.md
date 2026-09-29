# cli-website
Who needs a website when you have a terminal.

[![Netlify Status](https://api.netlify.com/api/v1/badges/f3bfb854-9bc6-40a7-8d4c-2cccd3850764/deploy-status)](https://app.netlify.com/sites/rootvc-cli-website/deploys)

## TUI experiment

The homepage remains the CLI. Type `tui` to open the Omarchy-inspired directory
inside the same terminal session; press `q` or choose Exit to CLI to return.
Run `npm run build`
then `npm start` to preview it with the Netlify application endpoint available.
For a static preview, serve `dist/` with any HTTP server (applications require
Netlify and `ATTIO_WEBHOOK_URL`).

- Overview, Portfolio, Team, Careers, Contact, and Appearance are menu sections.
- Use 1–6 to switch sections, left/right to move between panes, and arrows or
  j/k to browse entries or focus links and buttons. Enter activates the focused
  control. In Details, arrows scroll the bio; Tab or Enter focuses its actions.
  The active pane has a bright border and FOCUS label; the focused action has
  a solid highlight. Home/End goes to the start/end, Page Up/Down scrolls the pane,
  / focuses search, and Escape clears search or returns home. Tab reaches every
  control, including form fields and dialogs; ? opens the keyboard guide.
- Portfolio entries expose website, product, and investment memo links.
- Careers use a form backed by the existing Netlify application endpoint.
- Everforest, Gruvbox, Tokyo Night, and Paper palettes persist on this device.
- Existing `#tldr-<slug>`, `#whois-<slug>`, `#fg-<id>`, and `#apply-<id>` links
  still resolve on the CLI homepage. The same fragments work inside `tui.html`.
- The interface fills the viewport with independently scrolling panes. Existing
  team photos and company logos render as animated rainbow ASCII art; reduced
  motion preferences stop the animation.

`js/tui.js` and `css/tui.css` implement the interface; all firm, company, team,
and job data still comes from `config/*.js`. `js/tui-launcher.js` mounts the TUI on demand while retaining the CLI session.

## Build Notes
`npm run build` produces `dist/`, which is what Netlify publishes. It is wiped
and rebuilt from scratch each time, and it is gitignored — no build output is
ever committed.

That build:
 - copies the static assets (`images/`, `videos/`, `css/`, `welcome.htm`, and the
   `config/*.js` files `welcome.htm` loads directly)
 - copies and minifies the xterm vendor assets
 - bundles the TUI and shared config into `dist/js/tui.bundle.js`
 - retains the original runtime bundle in `dist/js/app.bundle.js`
 - emits a minified lazy-load asset for the RickRoll animation
 - generates the crawlable surface and `dist/index.html` (see below)

Anything not on the copy list in `scripts/build-assets.js` stays out of `dist/`,
so `scripts/`, `tests/`, `package.json`, and the unbundled `js/` sources are not
served.

`npm start` builds and then runs `netlify dev` against `dist/`.

## Crawlability
The terminal renders its content with JavaScript, so crawlers
that do not run JavaScript need a static content surface. `scripts/build-pages.js` closes that
gap from a single URL:

```
index.html     an offscreen block naming every company and person
_redirects     the old mirror URLs, 301'd into the terminal
llms.txt  llms-full.txt  robots.txt  sitemap.xml
```

Content is addressed by URL fragment: `/#tldr-chargelab` runs the company command
in the CLI. `/#tui` launches the TUI directly. Its own internal fragments use the
same formats, splitting command from argument on the **first** hyphen.

There used to be a static mirror here — real HTML pages at `/about/`, `/team/`,
`/portfolio/<slug>/` and the rest. It worked well enough to cause the problem it
had: Google indexed all 70-odd pages and started showing sitelinks to About /
Team / Jobs under the root.vc result, advertising a conventional website sitting
behind the terminal. It was removed in #128 and those URLs now 301 to their
commands. Since Google strips fragments before indexing, this deliberately
trades per-company search results for having exactly one indexed URL.

The homepage block is a `.visually-hidden` div rather than `<noscript>`:
extraction pipelines routinely strip `<noscript>` as non-content, and Googlebot
indexes the rendered DOM, which drops it once JS runs.

**`config/*.js` is the only source of truth.** Changing a portfolio description
regenerates the homepage block, the llms files, and the redirects.

There is nothing to keep in sync. None of it is ever committed — it exists only
in `dist/`, and every deploy runs `npm run build` and regenerates it from the
current `config/*.js`. No cron, no CI drift check, no "rebuild and commit" step:
a config edit reaches the generated files the moment it is deployed, because
that is the only way they come into existence.

`index.html` in the repo root is a **template**. The regions between its
`<!-- BEGIN generated-* -->` sentinels are empty; the build injects the JSON-LD
and crawlable-index blocks when it writes `dist/index.html`. Do not paste
generated content back into the template.

Use `npm run build:pages` to regenerate just those files while iterating —
`netlify dev` does not watch `config/*.js`.

Firm-level facts (blurb, thesis, fund size, office address, email) live in
`config/firm.js` so the terminal and the static pages cannot disagree. It has no
dependencies and must load before `config/commands.js` in both
`scripts/build-assets.js` and `welcome.htm`.

`config/firm.js`, `portfolio.js`, `team.js`, and `jobs.js` end with a guarded
`module.exports` so they work unchanged as classic browser scripts *and* as
CommonJS modules for `scripts/build-pages.js`. Keep the `typeof module` guard —
an unguarded `module` reference is a ReferenceError in the browser — and do not
convert them to ESM, which would break the bundle and `welcome.htm`.

## Performance Notes
The terminal now initializes on `DOMContentLoaded` instead of waiting for `window.onload`, and optional work such as ASCII art preloading happens after the terminal is already usable.

In local repeated Chromium benchmarks against the previous `HEAD`, median startup timings improved roughly:
 - homepage prompt visible: `1941.7ms` -> `70.1ms`
 - homepage first command rendered: `2076.5ms` -> `223.5ms`
 - `#whois-lee` deep link rendered: `1159.9ms` -> `151.9ms`

## Hosting
root.vc is served by **Netlify**, which publishes `dist/` — `server: Netlify` on
the live response, the apex `A` record points at Netlify's load balancer, and
`www` 301s to the apex.

The repo is also connected to a **Vercel** project. That project belongs to the
`ai-incarnations` branch (the parked AI-reinvention experiment, #110), which
carries its own `vercel.json` and builds there successfully. `main` has no
Vercel deployment, so Vercel had nothing to build on this line: every attempt
failed and posted a red check on PRs that had nothing to do with Vercel.

`vercel.json` here sets [`git.deploymentEnabled: false`][1], which turns off
automatic Vercel deployments for branches carrying this file.

Do not "fix" this by making it match the `ai-incarnations` copy — that branch
deliberately omits the key so it keeps deploying. If it is ever merged down,
expect a conflict on `vercel.json` and resolve it toward whichever host is
actually serving the domain at that point.

[1]: https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled

Live at: [https://root.vc](https://root.vc).

Special thanks to [Jerry Neumann](https://www.linkedin.com/in/jerryneumann/) at [Neu Venture Capital](https://neuvc.com/) for the inspiration for this website concept.

Thanks to the team at [divshot](https://www.divshot.com) for the awesome and hilarious [Geocities Bootstrap Theme](https://github.com/divshot/geo-bootstrap).

_aut viam inveniam aut faciam_
