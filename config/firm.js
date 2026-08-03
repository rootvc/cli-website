// firm.js — Facts about Root Ventures itself.
//
// This is pure data with no dependencies, so it can be read both by the
// terminal (via js/app.bundle.js) and by scripts/build-pages.js, which loads
// it in a Node vm sandbox to generate the static pages crawlers read.
//
// Anything here that describes the firm — the blurb, the address, the fund
// size — should live in this file only, so the terminal and the static pages
// can never disagree. Keep it free of `term`, `document`, and other globals.

const firm = {
  name: "Root Ventures",
  tagline: "Seeding bold engineers",
  thesis:
    "Investing at the earliest stages of technical founders taking engineering risk.",

  // Displayed by `whois root` and used as the description on the static pages.
  blurb:
    "Root Ventures is a San Francisco-based deep tech seed fund. As engineers ourselves, we specialize in leading initial funding for founders tackling new technical opportunities. Our initial investments typically range from $3-5M. With a selective few new deals a year and 2/3 of our funds in reserve, we are committed to being a long-term partner.",

  fundSize: "$190M",
  checkSize: "up to $5M",
  email: "hello@root.vc",

  // Split into schema.org PostalAddress fields so the static pages can emit
  // structured data without re-parsing a formatted string.
  address: {
    streetAddress: "2670 Harrison St",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94110",
    addressCountry: "US",
  },

  // Emitted as schema.org `sameAs`, which is how search engines and LLMs
  // reconcile this site with the firm's other profiles.
  social: [
    "https://twitter.com/rootvc",
    "https://github.com/rootvc",
    "https://instagram.com/machinepix/",
  ],

  // Emitted as schema.org `knowsAbout` on the Organization node.
  focusAreas: [
    "deep tech",
    "robotics",
    "hardware",
    "manufacturing",
    "developer tools",
    "machine learning",
    "semiconductors",
    "automation",
  ],
};

// Dual-mode. This file stays a classic browser script — it is concatenated into
// js/app.bundle.js and loaded by a raw <script src> tag in welcome.htm — while
// also being requireable by scripts/build-pages.js. `module` is undefined in a
// browser, so the line is inert there. Do not switch this to `export`: that
// would make the file a module and break both of the browser paths above.
if (typeof module !== "undefined") module.exports = { firm };
