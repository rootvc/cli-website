// firm.js — Canonical firm metadata. Read by the existing CLI runtime AND by the
// daily AI reinvention cycle (Author + Editor). When the cycle generates each
// daily artifact, every value here must be surfaced in the rendered DOM somewhere
// (smoke tests enforce; see DC6 in the plan).
//
// To edit:  this file is plain JS, edit values directly and commit.
// To add a new field: bundle source order is hard-coded in scripts/build-assets.js;
// this file is in `appBundleSources` so any new keys are immediately available to
// the live CLI. The cycle reads the file as a Node module via require().

const firm = {
  // Core identity
  name: "Root Ventures",
  tagline: "Seeding bold engineers",
  mission:
    "Investing at the earliest stages of technical founders taking engineering risk.",

  // Positioning
  thesis:
    "San Francisco-based deep tech seed fund. As engineers ourselves, we specialize in leading initial funding for founders tackling new technical opportunities.",
  stage: "Seed",
  sectorFocus: ["deep tech", "hard tech", "robotics", "manufacturing", "automation", "AI/ML", "devtools"],

  // Economics (kept loosely so they don't lie when reality drifts)
  fundSize: "$190M",
  typicalCheckSize: "$3M–$5M",
  reservesRatio: "2/3 reserves",
  cadence: "A selective few new deals per year",

  // Location
  address: "2670 Harrison St, San Francisco, CA 94110",
  city: "San Francisco",
  region: "CA",

  // Provenance
  founded: 2015,

  // Social handles (handles only; full URLs derived where needed)
  social: {
    twitter: "rootvc",
    twitterSecondary: "machinepix",
    instagram: "machinepix",
    github: "rootvc",
    site: "https://root.vc",
  },

  // Contact paths — anchor fact: at least one must be a clickable mailto/equivalent
  // in every daily artifact (R3 + DC6).
  contact: {
    primary: "hello@root.vc",
    annualMeeting: "https://annualmeeting.root.vc",
    careers: "https://root.vc/#jobs",
  },

  // The cycle uses this when assembling Author input. Editable text the team can
  // drop a one-liner into between cycles to nudge the next drop.
  dailyHookFilePath: "config/daily-hook.txt",
};

// Make available globally for the existing CLI runtime (matches config/team.js,
// config/portfolio.js patterns). The cycle's Node code uses module.exports.
if (typeof module !== "undefined" && module.exports) {
  module.exports = firm;
}
