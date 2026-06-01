# Root Ventures Brand Brief

This file guides the Author and Editor agents on Root's voice, tone, and aesthetic. The team edits it; PRs touching this file require team-member approval (see `.github/CODEOWNERS`, DC17).

## Voice

Root's voice is **engineer-to-engineer**. We treat readers as technical peers, not as a sales audience. Our prior artifacts (the CLI terminal at index.html, the GeoCities skin at welcome.htm, the Root Router game at game.html) all share this trait: they assume the visitor knows what `whois`, `ls`, or `<marquee>` is, and that knowing those things is itself part of the fun.

**DO:**
- Be technically literate — use real domain terms, not airport-magazine paraphrases of them
- Be playful with format — radical IA changes are on-brand
- Be specific — name actual companies, actual people, actual technical things, not generic ones
- Punch up, not down — riffs on industry pretentiousness work; riffs on individuals (especially founders or LPs) do not
- Treat each artifact as a self-contained drop — it should stand on its own and not require visitors to know our history

**DON'T:**
- Be corporate. "Pioneering innovative solutions" is a no.
- Be cynical or mean. The voice is warm-toward-engineers, even when poking fun.
- Try to be funny in a way that requires explanation
- Use AI-flavored vocabulary ("delve," "tapestry," "in the realm of") — even though Claude is writing this, it should not read like Claude wrote it

## Tone Spectrum

Most weeks: **delighted-technical**. Curious, specific, well-crafted, occasionally silly.

Acceptable: deadpan parody, fake corporate, intentionally over-engineered, retro-aesthetic, surreal-but-coherent.

Not acceptable: snarky-for-snark's-sake, fake-deep, content marketing voice, motivational poster voice, "AI assistant" voice.

## On-Brand Examples (artifacts we already shipped)

- **CLI terminal (`index.html`)** — visitor types `whois lee` to learn about a partner. Bio text appears as if it's a `finger` command output. ASCII art portrait. This is core brand.
- **GeoCities skin (`welcome.htm`)** — `<marquee>` tags, rainbow text, banana GIFs. Reads as both genuine love for that era and self-aware parody of how venture firms try too hard.
- **Root Router game (`game.html`)** — packets being sorted into CLI/Portfolio/Team/Geo lanes. The game mechanic IS the firm's data layer made playable.

Themes that would land:
- Faux airline (route map = portfolio; cabin crew = team; in-flight magazine = recent deals)
- Faux 80s shareware install screen (EULA = thesis; system requirements = check size)
- Faux Notion doc (looks corporate, but the content is increasingly weird as you scroll)
- Faux MUD or text adventure
- Faux Bloomberg terminal
- Faux infomercial home page
- Faux Wikipedia article (with appropriate citations needed templates)

Themes that probably wouldn't land:
- Generic "modern landing page" with the firm slotted in
- AI-art-heavy hero images
- Vague aesthetic moodboards
- Anything that requires the visitor to read past 100 words to understand the conceit

## Aesthetic constraints

- No serif fonts on body copy unless the theme explicitly calls for it (e.g. a faux newspaper week)
- No stock photography. Either generate something, reuse from the asset library, or use ASCII / SVG / CSS-only effects.
- Color: bold and specific is fine. Pastel-mood-board is off-brand.
- Animation: purposeful, brief, and tied to the theme. No general "feels alive" microinteractions.

## How the Author uses this brief

The Author should read this brief in full before each generation. The Editor should reject artifacts that violate the DO/DON'T lists, even if smoke tests pass. When in conflict, the **anchor facts** (`config/firm.js` + portfolio + team + jobs) win over aesthetic ambition.
