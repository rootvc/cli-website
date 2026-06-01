# Image asset library

The Author may reuse anything in this directory when generating each week's artifact. Don't blow the per-archive size budget (DC4: 2MB target, 5MB hard cap) by inlining large files — reference them by path instead.

## Directory layout

- `geo/` — GeoCities-era GIFs and JPGs that ship with the welcome.htm skin. Banana dividers, marquee borders, under-construction signs, Hammer-time animations, rainbow dividers, Counter widgets. Ideal for any retro-web theme.
- `logo.png` — Root Ventures wordmark. The canonical brand mark.
- `og-image.png` — Open Graph share image. Don't inline this; it's intended for `<meta og:image>` only.
- (per-portfolio company filenames like `esper.png`, `meroxa.png`, etc.) — small logos / wordmarks for portfolio companies. Use for any theme that wants to surface the portfolio visually.

## Reuse vs generation

The brand brief gives the Author latitude to either reuse from this library or generate new visual content. The right choice depends on the theme:

- Retro-web themes → lean heavily on `geo/` (it's what makes them feel real)
- Faux-corporate themes → prefer minimalist SVG generated inline
- Game / interactive themes → mostly CSS / SVG generation; vendor portrait images only if the team is part of the gameplay loop
- Newspaper / catalog themes → minimal images; the layout does the work

## Adding new reusable assets

Drop the file in this directory (or a subdirectory if a cluster of related files), commit it with a note in this README about its intended use. The asset becomes available to next week's cycle automatically; configs are read from the working tree at cycle start.
