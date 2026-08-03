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

## Performance Notes
The terminal now initializes on `DOMContentLoaded` instead of waiting for `window.onload`, and optional work such as ASCII art preloading happens after the terminal is already usable.

In local repeated Chromium benchmarks against the previous `HEAD`, median startup timings improved roughly:
 - homepage prompt visible: `1941.7ms` -> `70.1ms`
 - homepage first command rendered: `2076.5ms` -> `223.5ms`
 - `#whois-lee` deep link rendered: `1159.9ms` -> `151.9ms`

## Hosting
root.vc is served by **Netlify** — `server: Netlify` on the live response, the
apex `A` record points at Netlify's load balancer, and `www` 301s to the apex.

The repo is also connected to a **Vercel** project. That project is used by the
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
