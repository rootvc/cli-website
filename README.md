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
Run `npm run build` before serving the site locally or deploying.

That build now:
 - copies and minifies the xterm vendor assets
 - bundles the app boot/runtime code into `js/app.bundle.js`
 - emits a minified lazy-load asset for the RickRoll animation
 - generates the static mirror (see below)

## The static mirror
The terminal renders its content only when someone types a command, so search
engines and LLM crawlers see an empty page. `scripts/build-pages.js` renders the
same `config/*.js` data as plain HTML at real URLs:

```
/about/  /jobs/  /portfolio/  /portfolio/<slug>/  /team/  /team/<slug>/
robots.txt  sitemap.xml  llms.txt  llms-full.txt
```

**`config/*.js` is the only source of truth — never edit the generated files.**
Changing a portfolio description regenerates that company's page, both indexes,
the sitemap, the llms files, and the `<noscript>` block in `index.html`. The
regions between the `<!-- BEGIN generated-* -->` sentinels in `index.html` are
rewritten on every build.

Three things keep it in sync:
 - `npm run build` generates it, so every Netlify deploy publishes current data
 - the output is committed, so it survives a failed build and is reviewable in PRs
 - `npm run build:pages:check` fails CI if the committed copy has drifted

Use `npm run build:pages` to regenerate just the mirror while iterating —
`netlify dev` does not watch `config/*.js`.

Firm-level facts (blurb, thesis, fund size, office address, email) live in
`config/firm.js` so the terminal and the static pages cannot disagree. It has no
dependencies and must load before `config/commands.js` in both
`scripts/build-assets.js` and `welcome.htm`.

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
