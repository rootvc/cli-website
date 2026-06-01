---
date: 2026-06-01
topic: weekly-ai-reinvention
---

# Weekly AI-Reinvented root.vc

## Problem Frame

Root Ventures has an unusual asset: its brand identity is already "Root makes weird, technically-loved things." The current site is a CLI terminal at [index.html](index.html); [welcome.htm](welcome.htm) is a GeoCities skin; [game.html](game.html) is the new Root Router game. All three render off a shared data layer of object-literal configs in [config/](config/) ([portfolio.js](config/portfolio.js), [team.js](config/team.js), [jobs.js](config/jobs.js)).

Idea: stop building reinventions by hand. Every Monday, Claude generates an entirely new artifact at root.vc — could be a faux airline, an RPG, a parody of Notion, a fake search engine, a Hypercard stack — but always weaves the firm's real facts (firm metadata, portfolio, team, jobs, contact) into the experience in theme-appropriate ways. Past incarnations are statically frozen and accessible through an in-world "history" entrance that is itself re-imagined each week. Each cycle also outputs a marketing-ready press kit (tweet drafts, screenshot brief, editorial note) that the team can pull from.

Most companies couldn't do this — radical IA churn would wreck their SEO and confuse their customers. Root's audience (founders, engineers, press) and its brand position (engineering whimsy as identity) make the surface uniquely safe for radical reinvention.

Outcomes in priority order:

1. **Craft.** The artifact itself is the point.
2. **AI-native founder signal.** Founders who see it think "Root gets it" and reach out.
3. **Press / category-defining brand.** First VC firm with a fully generative website.

Engineer-recruiting is a derived bonus, not an optimization target.

---

## Actors

- A1. **Site visitors** — founders, engineers, journalists, LPs, prospective hires. Encounter the current weekly artifact at root.vc and may navigate to the in-world history.
- A2. **Root team (ops layer)** — Lee, Avidan, Kane, Chrissy, et al. Edit plain-text config files; rate drops after they ship; share drops to social.
- A3. **Author agent** — autonomously picks each week's theme/concept and generates the full artifact + press kit. May riff on the topical context (A6) or ignore it; choice is per-cycle.
- A4. **Editor agent** — reviews Author's output against brand brief, no-fly list, smoke tests, theme-diversity memory, and (when present) topical context for tone-deafness; rejects with critique or approves for ship.
- A5. **Archive** — statically preserves each frozen past incarnation with its metadata, social drafts, ratings, and engagement data.
- A6. **Topical context fetcher (optional pre-Author step)** — runs a multi-query social search across recent tech/VC zeitgeist (1–7 days) and summarizes results into a 3–5 bullet brief the Author may use as a seed. Fail-soft: if it fails, the cycle proceeds without a topical seed.

---

## Key Flows

- F1. **Weekly drop cycle**
  - **Trigger:** Sunday-evening cron tick.
  - **Actors:** A3, A4, A6
  - **Steps:** (1) Topical context fetcher (A6) runs a multi-query social search over the last 1–7 days and summarizes into a brief; on failure, the cycle proceeds without a topical seed; (2) Author reads configs + brand brief + performance log (last N drops with ratings + social + Editor's prior notes) + theme-diversity memory + optional topical context; (3) Author picks theme and generates artifact + meta + social press kit; Author may riff on the topical context or ignore it entirely; (4) Editor reviews against brand brief, no-fly list, smoke tests, and (when present) topical-context sensitivity; (5) on rejection, Author revises up to N times; (6) on Editor approval, smoke tests run; (7) on pass, ship to root.vc Monday morning; (8) archive entry created.
  - **Outcome:** root.vc shows a new artifact; archive entry exists with frozen site + metadata + social drafts + topical-or-not theme key.
  - **Covered by:** R1, R3, R5, R6, R7, R8, R9, R17, R18, R21, R22, R23, R24

- F2. **Visitor encounters current week's artifact**
  - **Trigger:** A1 lands at root.vc (or follows a social link).
  - **Actors:** A1
  - **Steps:** (1) Site loads in current week's frame; (2) visitor explores and discovers anchor facts woven into the artifact; (3) visitor may discover the in-world entrance to history.
  - **Outcome:** Visitor has had a memorable encounter and (in the good case) knows what Root is, what they invest in, how to reach out, and that there is a back-catalog.
  - **Covered by:** R3, R8, R11, R12

- F3. **Visitor navigates to history**
  - **Trigger:** A1 finds the week's in-world entrance to past incarnations.
  - **Actors:** A1
  - **Steps:** (1) Visitor opens the history view (themed for current week); (2) visitor sees a navigable list of past frozen incarnations; (3) visitor clicks one and lands on the statically-preserved old site at its permalink.
  - **Outcome:** Visitor can browse back-catalog; each old incarnation is fully intact.
  - **Covered by:** R10, R11, R12

- F4. **Generation or ship failure → graceful degrade**
  - **Trigger:** Editor never approves within retry limit, or smoke tests fail.
  - **Actors:** A3, A4
  - **Steps:** (1) Failure detected pre-ship; (2) root.vc remains pointed at last successful drop; (3) team is notified via existing notification surface; (4) next cycle runs as scheduled.
  - **Outcome:** No broken or off-brand site ever reaches visitors; the brand "ratchet" only goes forward.
  - **Covered by:** R7, R18, R19

---

## Cycle diagram

```
   ┌──────────────────────┐
   │ Editable text configs│ ← team edits anytime (effect: NEXT cycle)
   │ portfolio, team,     │
   │ jobs, firm meta,     │
   │ brand brief,         │
   │ no-fly list,         │
   │ weekly hook field    │
   └─────────┬────────────┘
             │
   ┌─────────▼─────────────────────┐
   │ Sunday early eve: Topical     │ ── fails ──► proceed w/o seed
   │ fetcher (/last30days, 1-7d)   │
   │ → 3-5 bullet topical brief    │
   └─────────┬─────────────────────┘
             │ (seed may be empty)
   ┌─────────▼────────────┐         ┌──────────────────────────────┐
   │ Sunday: Author agent │ ◄────── │ Performance log (last N      │
   │ picks theme + writes │         │ drops + ratings + social +   │
   │ artifact + meta +    │         │ Editor notes + theme keys +  │
   │ social press kit     │         │ topical flags)               │
   │ (riffs on topical    │         └──────────────────────────────┘
   │  brief OR ignores)   │
   └─────────┬────────────┘
             │
   ┌─────────▼────────────┐
   │ Editor agent reviews │ ─── reject ──► Author revises (≤ N tries)
   │ vs brand brief,      │                (may drop the topical hook
   │ no-fly, smoke tests, │                 if it was the problem)
   │ diversity memory,    │
   │ topical sensitivity  │
   └─────────┬────────────┘
             │ approve
   ┌─────────▼────────────┐
   │ Smoke tests run      │ ─── fail ──► Keep last week's site
   │ against artifact     │              + alert team
   └─────────┬────────────┘
             │ pass
   ┌─────────▼────────────┐         ┌────────────────────────────┐
   │ Ship to root.vc      │ ─────► │ Archive: freeze HTML/CSS/JS │
   │ Monday morning       │         │ at /archive/YYYY-MM-DD     │
   └──────────────────────┘         │ + meta + social drafts     │
                                    │ + topical_hook (if any)    │
                                    └──────────┬─────────────────┘
                                               │
                                    Mon–Sat: team rates;
                                    social engagement auto-tracked;
                                    both attached to archive entry
                                               │
                                    (feeds next cycle's performance log)
```

---

## Requirements

**Reinvention substrate**

- R1. Existing configs in [config/](config/) ([portfolio.js](config/portfolio.js), [team.js](config/team.js), [jobs.js](config/jobs.js)) remain the source of truth for facts. The AI reads but never invents or modifies the underlying fact data.
- R2. Expand the config layer with plain-text-editable files for: (a) firm metadata (name, mission, thesis, fund size, check size, address, founded date, social handles), (b) contact + CTAs (`hello@root.vc`, application URL, agm URL), (c) brand brief (voice DOs, tone), (d) no-fly list (taboo topics, off-brand framings, hard-no aesthetics), (e) asset library pointers (the existing `images/` and per-portfolio assets, with intended use), (f) an optional "weekly hook" single-line text field the team can drop a one-liner into to nudge that week's generation.
- R3. Every generated artifact must surface, somewhere visible to a curious visitor: firm identity + mission, the full portfolio list, the full current team, and a working contact path. The surfacing can be playful, oblique, or rewarding-of-exploration ("easter eggs"), but cannot omit any of these facts.
- R4. The artifact may reuse assets from the asset library OR generate new visual content within the brand brief; the choice is the Author's.

**Weekly generation pipeline**

- R5. Every Monday, the site served at root.vc is replaced with a newly-generated artifact. No two consecutive weeks share the same theme.
- R6. The Author agent selects the week's theme/concept autonomously — no human picks the concept.
- R7. The Editor agent reviews each Author output against (a) brand brief, (b) no-fly list, (c) smoke-test results, (d) theme-diversity memory (last N themes' "theme keys"). On rejection, sends a critique back; Author may revise up to N times per cycle.
- R8. Each cycle's output is structured as a press kit: `{ site: { html, css, js, assets }, meta: { theme_name, editorial_note, where_facts_live, history_view_concept, theme_keys[], topical: boolean, topical_hook?: string }, social: { tweet_draft, tweet_thread, linkedin_draft, screenshot_brief } }`. The `topical` boolean records whether the cycle riffed on the topical seed; `topical_hook` (when present) captures the specific event/trend referenced.
- R9. The Author's prompt includes a "performance log" section: the last N drops' theme names + theme keys + topical flags + ratings + social engagement counts + Editor's past notes. The Author is instructed to synthesize patterns (lean into high-rated traits, avoid low-rated patterns, avoid theme-key repetition, avoid topical-clustering — e.g. multiple weeks in a row of news riffs).

**Topical seeding (optional pre-Author input)**

- R21. Each cycle runs an optional pre-Author step that performs a multi-query social search across tech/VC zeitgeist channels (Hacker News, X/Twitter, Reddit, tech news, etc.) over the last 1–7 days and summarizes findings into a 3–5 bullet "topical context" brief. The brief is passed to the Author as an optional seed.
- R22. The Author may riff on any element of the topical context or ignore it entirely; the choice is per cycle, made by the Author, not configured externally. The Author's prompt explicitly states that variety matters and not every drop should be topical.
- R23. The Editor agent is shown the topical context too. When the Author has riffed on it, the Editor specifically checks for tone-deafness, tragic-event sensitivity, and portfolio-negative news handling. Off-tone riffs are rejected; the cycle either revises away from the hook or proceeds without topical seeding for that cycle.
- R24. Failure of the topical fetcher (rate limits, API down, no relevant results) is non-blocking: the cycle proceeds with `topical: false` and the Author works without a seed.

**History and archive**

- R10. Every past drop is statically frozen at generation time (HTML/CSS/JS/assets preserved as-is) and served at a stable permalink, e.g. `root.vc/archive/YYYY-MM-DD/`. Permalinks never break.
- R11. The history view is generated as a sub-deliverable of each weekly cycle. It surfaces the list of past incarnations in a way that fits the current week's theme (e.g. "hall of statues" room in RPG week, "filing cabinet" in office-parody week, "back issues display" in newsstand week).
- R12. Every generated artifact must include at least one discoverable in-world entrance to the current week's history view. The entrance can be obvious or rewarding-of-exploration but must exist.

**Social / press kit output**

- R13. Each cycle produces marketing-ready drafts: a tweet draft, a tweet thread, a LinkedIn-style longer-form variant, and a screenshot brief identifying the most shareable view(s) of the artifact.
- R14. Marketing artifacts are stored alongside the archive entry and remain accessible to the team for later use (sharing, quoting in the next week's prompt, retrospective posts).

**Self-improvement loop**

- R15. After each drop ships, team members may rate the drop on a 1–5 scale with an optional free-text note. Ratings are stored against the archive entry.
- R16. The system tracks automated social engagement signals (mentions, shares, link-share counts of `/archive/` permalinks) per drop. Engagement data is attached to the archive entry as it accumulates.
- R17. The next cycle's performance log (R9) includes raw ratings + raw social numbers + Editor's prior notes. The system does not compute a weighted "score" — Claude synthesizes from the raw signals in the prompt.

**Operational guarantees**

- R18. Every generated artifact passes an automated smoke test suite before shipping. Tests verify at minimum: the firm name appears in rendered output; the portfolio renders with the expected number of items; the contact link is a functional `mailto:` (or equivalent); the history entrance is reachable; the page loads without JS errors. The existing [tests/](tests/) suite is the starting point for these checks.
- R19. If the cycle cannot produce an artifact that passes Editor + smoke tests within the retry limit, root.vc remains on the last successful drop and the team is notified.
- R20. Team-edited configs take effect on the NEXT generation cycle. The current week's frozen artifact does not reflect mid-week config edits — frozen means frozen.

---

## Acceptance Examples

- AE1. **Covers R3.** Given the Author picks "fake airline" as the week's theme, when the site renders, the firm's mission ("seeding bold engineers") appears as a tagline on the in-flight magazine cover, the portfolio companies render as flight-deck route cards, the team appears as cabin crew portraits with their bios as flight attendant intros, and `hello@root.vc` is reachable somewhere — perhaps as the "lost-and-found" contact in the safety card.

- AE2. **Covers R7, R18, R19.** Given the Author generates a site whose JavaScript throws on load, when the Editor reviews, the Editor returns a critique citing the JS error; if after N revision cycles no clean output is produced, root.vc remains on the previous week's artifact and a notification is sent to the team — no broken site is ever shipped.

- AE3. **Covers R11, R12.** Given the current week's theme is "RPG," when the visitor explores the artifact, a "hall of statues" room is discoverable; clicking a statue navigates to a frozen past incarnation at its `/archive/YYYY-MM-DD/` permalink; each past incarnation is fully intact and self-contained.

- AE4. **Covers R8, R13, R14.** Given a drop has shipped, when a team member opens the archive entry for that drop, they see (a) a permalink to the frozen site, (b) a theme name and editorial note, (c) a tweet draft they can copy into Twitter, (d) a screenshot brief telling them what to capture, and (e) a place to leave a rating.

- AE5. **Covers R9, R17.** Given the last 3 drops were rated 4, 5, and 2 with notes "loved the in-world history," "great copy voice," and "felt thin and generic" respectively, when the next Author cycle runs, the performance log contains those raw signals (theme names, ratings, notes), and the Author's generated theme avoids the patterns flagged in the 2-rated drop.

---

## Success Criteria

- **Human outcome (visitor).** A founder, engineer, or journalist lands on root.vc on a random Monday and has a memorable encounter that conveys Root's identity even when the format is unexpected. They leave knowing what Root invests in and how to reach out, without ever seeing a conventional "about us" page.
- **Compounding value (archive).** After 6 months (~26 drops), the archive is itself a destination — shared, navigated, linked to. Old incarnations are at least as interesting as the current week.
- **Press / social.** At least one drop per quarter generates organic press coverage or significant social engagement attributable to the launch.
- **Brand integrity.** Zero drops over any 6-month period violate the no-fly list, contain false facts about the firm/portfolio/team, or omit anchor facts.
- **Operational reliability.** ≤2 cycles per year fall back to last-week's site due to generation failure.
- **Downstream handoff.** A planning agent reading this document can produce an implementation plan without inventing product behavior, scope boundaries, or success criteria.

---

## Scope Boundaries

### Deferred for later

- Daily reinvention cadence — evaluate after 2–3 months of weekly operation.
- Mid-week event-triggered drops (e.g. portfolio company news, AGM week).
- Per-visitor personalization. Every visitor sees the same week's drop.
- Auto-generation of new portfolio/team/jobs facts. Configs are human-edited only.
- A/B testing of variants within a single week.
- Mobile-specific generation. One artifact serves all devices; the Author is responsible for responsiveness within the brand brief.
- An automated "fact-checker" agent separate from the Editor. The Editor handles brand + structural + factual checks.

### Outside this product's identity

- A static template-driven website with a generative theme system. The artifact IS the site; this is not a CMS with skinning.
- A user-facing magazine "issue #N" framing. Editorial framing is internal metadata only, never surfaced to visitors as the primary frame.
- A sidecar "stable about page" at a separate URL. Anchor facts live INSIDE each weekly artifact, not as a parallel safety surface.
- A founder-discovery or portfolio-evaluation product surface. This is a brand artifact, not an investment-operations tool.
- A primary engineering-recruiting funnel. Recruiting is a derived bonus, not an optimization target.
- A human-in-loop concept-selection gate. The AI picks the concept autonomously by design; that autonomy is part of the product, not a bug to be patched.

---

## Key Decisions

- **Weekly Monday cadence.** Daily was rejected (too high variance, weaker drop psychology, costlier); bi-weekly was rejected (too slow to build habit).
- **AI picks theme autonomously.** No human concept gate, no AI-proposes-N-options pick. Full autonomy at theme level is part of the signal.
- **Configs as deterministic substrate; AI as renderer/author on top.** The team controls the facts via plain-text configs; the AI controls presentation, format, and voice.
- **Facts woven into the artifact; no sidecar.** Discovery is part of the humor. Founders who land on a weird week find the facts inside the experience, not by escape hatch.
- **History as in-world themed entrance.** The history page is itself reinterpreted each week. The archive's URL exists as a stable permalink, but the primary path into it is the in-world entrance from the current artifact.
- **Editorial reasoning as private metadata only.** Magazine framing is internal; user-facing site does not say "Issue #47." Editorial notes are saved alongside archive entries for team browsing + social drafts.
- **Author + Editor agent pair.** Single-agent was rejected for missing the craft safety net under full autonomy; larger multi-agent factories were rejected as over-engineered for weekly cadence.
- **Press kit as first-class output.** Each cycle ships marketing-ready artifacts the team will actually use, not just a deployed site.
- **Self-improvement via raw performance log fed to next-cycle prompt.** No weighted scoring system. Claude synthesizes from raw ratings + raw social + Editor's prior notes.
- **Frozen archives.** Each past drop is statically preserved; permalinks never break; mid-week config edits don't retroactively change shipped artifacts.
- **Full auto ship gate.** Editor approval + smoke-test pass are the only gates between generation and Monday-morning ship. No human preview window, no soft veto, no explicit approve-to-ship step. Soft-veto and explicit-approve patterns were considered and rejected as friction against the chosen autonomy posture; the safety net lives entirely inside the system (Editor critique loop, smoke tests, rollback to last-good drop on any failure).
- **Optional topical seeding via multi-query social search.** Each cycle MAY surface a tech/VC zeitgeist brief from the last 1–7 days as an Author-discretion seed. Author decides per cycle; topical-vs-free is captured in theme keys so the diversity memory can prevent recency-bias clustering. Rejected the alternative of always-on topical (would become a crutch) and the alternative of an external "topical week" flag (would push the discretion outside the AI in a way that's inconsistent with the autonomy posture).

---

## Dependencies / Assumptions

- Claude API (or equivalent) is reliably available with a context window sufficient for configs + brand brief + performance log + generation instructions + Editor pass.
- Some mechanism for tracking social engagement signals (mentions, shares, /archive/ link counts) exists or can be built. Twitter API constraints since 2023 mean this is *not* a free given.
- The existing [tests/](tests/) suite (Vitest-based; includes [tests/game.test.js](tests/game.test.js) shipped in `e988c7b`) is extensible with smoke tests against generated artifacts.
- The site is deployed via Netlify (per [netlify.toml](netlify.toml)); the deploy pipeline can be triggered weekly by an external scheduler.
- The team is willing to rate each weekly drop (one click + optional note).
- The team will edit plain-text configs without a code review for fact updates.
- The cost of weekly generation (estimated ~$5–10 per cycle worst-case, ~$250–500/year) is acceptable.
- Visitors of root.vc generally tolerate the surprise of radical format change between visits — this assumption is true for the current quirky-CLI brand and would NOT be true for a more conventional firm.
- Before first autonomous cycle ships, the team will run a ~15-minute exercise to populate the initial no-fly list (taboo topics, off-brand framings, hard-no aesthetics, plus standing guidance on tragic/portfolio-negative event handling for topical riffs). This is a launch-time content task, not a planning blocker.
- The `/last30days` skill (or an equivalent multi-query social search across HN/X/Reddit/tech-news) is callable inside the weekly cycle. The skill's default time window may be 30 days; tighter windows (1–7 days) are likely supported via the query layer but need verification at planning time. The system is designed to function with whatever window is available, falling back gracefully if the search itself fails.

---

## Outstanding Questions

### Resolve Before Planning

*(None — all blocking product decisions are resolved.)*

### Deferred to Planning

- [Affects R5][Technical] Monday drop time of day (9am ET / 9am PT / midnight UTC). Picked at planning when deploy mechanics are designed.
- [Affects R15][Technical] Rating surface — Slack bot, `/rate` CLI command (fits the existing terminal aesthetic), archive UI, or a Netlify function. Build simplest first; iterate.
- [Affects R2][Technical] Concrete format for the expanded config layer (JSON / YAML / TOML / JS module) and where the files live in the repo.
- [Affects R5][Technical] Where the weekly generation cycle runs (GitHub Actions, Netlify build hook, dedicated cron worker, Cloudflare Worker).
- [Affects R10][Technical] How frozen archives are served — same Netlify deploy with `/archive/...` paths, separate static bucket, branched deploys per drop?
- [Affects R16][Needs research] Reliable post-2023 mechanism for auto-tracking Twitter/X engagement of `/archive/...` permalinks, plus HN and LinkedIn options.
- [Affects R18][Technical] Smoke-test framework — extend the existing Vitest suite ([tests/](tests/)) or add a Playwright pass against the rendered artifact.
- [Affects R7][Technical] Editor's specific revision protocol — does Editor patch Author's output in place, or send a critique back for Author to redo end-to-end?
- [Affects R8][Technical] Press-kit output schema validation — JSON Schema, Zod, or a TypeScript type the Author/Editor must satisfy.
- [Affects R12][Technical] How the prompt enforces "discoverable history entrance must exist" — explicit Editor check, or a smoke test that grep-walks the rendered DOM.
- [Affects R21][Needs research] Exact time-window parameters supported by `/last30days` (or equivalent). Confirm whether 1–3 day windows are queryable, and if not, identify a fallback search mechanism.
- [Affects R21][Technical] Query taxonomy for the topical fetcher — which channels (HN front-page, X trending in tech, Reddit r/programming + r/ycombinator, VC newsletters, etc.) and how to weight them in the summarization prompt.
- [Affects R23][Operational] Editor's sensitivity check for topical riffs — explicit rubric (deaths, tragedies, layoffs, indictments, portfolio-company-negative news) baked into the Editor prompt vs reliance on general "be thoughtful" guidance.

---

## Next Steps

`Resolve Before Planning` is empty. -> `/ce-plan` for structured implementation planning.
