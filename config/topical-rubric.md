# Topical Sensitivity Rubric

Used by the Editor to evaluate whether the Author's topical riff is appropriate to ship. Four tiers. Each topical hook from `/last30days` (or the WebSearch fallback) is classified by the Editor; the artifact only ships if every referenced hook is in tier 3 or 4.

PRs touching this file require team-member approval (see `.github/CODEOWNERS`, DC17).

## Tier 1 — Hard block

Author must never riff on these. Editor must reject any artifact that does.

- Deaths, memorials, tragedies, mass-casualty events
- Active wars, humanitarian crises, natural disasters
- Indictments, prosecutions, accusations of criminal wrongdoing
- Layoffs and bankruptcies (any company, not just portfolio)
- Public mental-health crises of named individuals
- Anything affecting a current Root portfolio company in a negative light, no matter how light the touch

Examples:
- "AWS outage takes down half the internet" → soft block, see Tier 2 (depends on whether it's a tragedy or just a Tuesday)
- "Tech founder X arrested" → hard block, never engage
- "Portfolio company Y misses revenue" → hard block, never engage
- "Earthquake disrupts semiconductor fabs" → hard block

## Tier 2 — Soft block

Author should avoid these. If the Author rides them anyway, the Editor rejects unless the framing is unusually generous and the topic is unusually impersonal.

- Portfolio-neutral but mediocre news ("X raises bridge round at flat valuation")
- Competitor VC firms in any context (we don't punch sideways)
- Spicy founder Twitter beefs
- Generic crypto-related controversies (the topic itself has too much baggage)
- Partisan politics, even oblique
- "Cancellations" of public figures
- AI-doomer-vs-accelerationist takes

Examples:
- "Stripe raises at $X valuation" → soft block, fine if just background context, off-brand as the artifact's main joke
- "Microsoft layoffs" → soft block, becomes hard block if specific individuals are named
- "Crypto winter is over" → soft block, too played out

## Tier 3 — Approve with care

These topics work if the framing is right. Editor should check: is the riff genuinely original? Is the take warm rather than mean? Does it punch up at industry trends, not down at individuals?

- General industry chatter (hype cycles, "everyone's pivoting to X")
- Hardware/robotics news (especially anything Root's portfolio is adjacent to)
- Open-source ecosystem events
- Technical curiosities (a new programming language drops, a major paper publishes)
- Conferences and demo days as collective events (not specific embarrassing moments)
- Self-deprecating riffs on VC industry tropes

Examples:
- "Every AI startup pivot is now to agents" → great Tier 3 material
- "Y Combinator demo day was 200 startups in 8 hours" → fine if the riff is on demo-day-as-format, not specific founders
- "New JS framework dropped, devs argue about it" → classic Tier 3

## Tier 4 — Lean in

These topics are pure gold. Editor should treat them as the most likely path to a memorable drop.

- Weird internet ephemera (a cursed Wikipedia article, a niche subreddit, a forgotten 1990s software product back in the news)
- Genuinely surprising tech news (a major capability arriving years early or late)
- Industry milestones that everyone will mention (e.g. "ChatGPT turns N years old today")
- Cross-domain analogies (something happening in non-tech that maps weirdly well onto a tech trope)
- Anniversaries of beloved-by-engineers things (Unix birthday, Hubble launch anniversary, etc.)

Examples:
- "Today is the 30th anniversary of the first Pixar Toy Story render farm" → lean in hard
- "Someone trained an LLM to play chess and it discovered the King's Indian Defense" → lean in
- "Old Geocities pages have a higher Lighthouse score than modern Tailwind sites" → exactly the kind of thing Root would publish a drop about
