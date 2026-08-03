# cli-website
Who needs a website when you have a terminal.

[![Netlify Status](https://api.netlify.com/api/v1/badges/f3bfb854-9bc6-40a7-8d4c-2cccd3850764/deploy-status)](https://app.netlify.com/sites/rootvc-cli-website/deploys)

## Basic Commands
  - help: list all commands
  - whois root: learn about us
  - whois [partner]: learn about a partner
  - tldr: list all portfolio companies
  - tldr: [company_name]": learn about a portfolio company
  - email: reach out to us
  - twitter: twitter accounts
  - instagram: instagram account
  - git: this repo
  - github: all repos
  - locate: physical address
  - www: plain-text version of this site
  - test: do not use
  - other: try your favorite linux commands

## Advanced Commands
 - alias
 - cat
 - cd
 - chmod
 - chown
 - clear
 - cp
 - curl
 - df
 - echo
 - emacs
 - exit
 - fdisk
 - find
 - finger
 - free
 - ftp
 - grep
 - groups
 - gzip
 - head
 - history
 - kill
 - less
 - ls
 - man (alias: woman)
 - mkdir
 - more
 - mv
 - nano
 - open
 - passwd
 - pico
 - pine
 - ps
 - pwd
 - quit
 - rm
 - say
 - sftp
 - ssh
 - stop
 - su
 - sudo
 - tail
 - top
 - touch
 - uname
 - vi
 - vim
 - zsh

Missing a favorite one? Make a PR!

## Portfolio CLIs
Future project: get the Hello Worlds working for every portfolio company with a CLI or npm/pypi/cargo package
 - esper
 - great_expectations (alias: ge)
 - meroxa
 - okteto
 - particle
 - privacy_dynamics (alias: privacy)
 - zed

## Build Notes
`npm run build` produces `dist/`, which is what Netlify publishes. It is wiped
and rebuilt from scratch each time, and it is gitignored — no build output is
ever committed.

That build:
 - copies the static assets (`images/`, `videos/`, `css/`, `welcome.htm`, and the
   `config/*.js` files `welcome.htm` loads directly)
 - copies and minifies the xterm vendor assets
 - bundles the app boot/runtime code into `dist/js/app.bundle.js`
 - emits a minified lazy-load asset for the RickRoll animation
 - generates the static mirror and `dist/index.html` (see below)

Anything not on the copy list in `scripts/build-assets.js` stays out of `dist/`,
so `scripts/`, `tests/`, `package.json`, and the unbundled `js/` sources are not
served.

`npm start` builds and then runs `netlify dev` against `dist/`.

## The static mirror
The terminal renders its content only when someone types a command, so search
engines and LLM crawlers see an empty page. `scripts/build-pages.js` renders the
same `config/*.js` data as plain HTML at real URLs:

```
/about/  /jobs/  /portfolio/  /portfolio/<slug>/  /team/  /team/<slug>/
robots.txt  sitemap.xml  llms.txt  llms-full.txt
```

**`config/*.js` is the only source of truth.** Changing a portfolio description
regenerates that company's page, both indexes, the sitemap, the llms files, and
the `<noscript>` block in `index.html`.

There is nothing to keep in sync. The mirror is never committed — it exists only
in `dist/`, and every deploy runs `npm run build` and regenerates it from the
current `config/*.js`. No cron, no CI drift check, no "rebuild and commit" step:
a config edit reaches the static pages the moment it is deployed, because that
is the only way the pages come into existence.

`index.html` in the repo root is a **template**. The regions between its
`<!-- BEGIN generated-* -->` sentinels are empty; the build injects the JSON-LD
and `<noscript>` blocks when it writes `dist/index.html`. Do not paste generated
content back into the template.

Use `npm run build:pages` to regenerate just the mirror while iterating —
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

Live at: [https://root.vc](https://root.vc).

Special thanks to [Jerry Neumann](https://www.linkedin.com/in/jerryneumann/) at [Neu Venture Capital](https://neuvc.com/) for the inspiration for this website concept.

Thanks to the team at [divshot](https://www.divshot.com) for the awesome and hilarious [Geocities Bootstrap Theme](https://github.com/divshot/geo-bootstrap).

_aut viam inveniam aut faciam_
