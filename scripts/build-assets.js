const fs = require("fs");
const path = require("path");
const { minify } = require("terser");
const { writePages } = require("./build-pages");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "dist");

const vendorScripts = [
  {
    src: "node_modules/@xterm/xterm/lib/xterm.js",
    dest: "js/xterm.js",
    minify: true,
  },
  {
    src: "node_modules/@xterm/addon-fit/lib/addon-fit.js",
    dest: "js/addon-fit.js",
    minify: true,
  },
  {
    src: "node_modules/@xterm/addon-web-links/lib/addon-web-links.js",
    dest: "js/addon-web-links.js",
    minify: true,
  },
  {
    src: "node_modules/aalib.js/dist/aalib.js",
    dest: "js/aalib.js",
    minify: true,
  },
];

// Order matters: these are concatenated into one classic script, so anything
// referenced at the top level of a later file must be defined by an earlier
// one. config/commands.js reads `firm`, `team`, and `portfolio` at top level.
const appBundleSources = [
  "js/terminal.js",
  "js/terminal-ext.js",
  "js/ascii-art.js",
  "config/help.js",
  "config/firm.js",
  "config/portfolio.js",
  "config/team.js",
  "config/commands.js",
  "config/fs.js",
  "config/jobs.js",
  "js/bootstrap.js",
];

// Copied into dist/ verbatim. config/*.js is here because welcome.htm loads it
// with raw <script src> tags rather than through the bundle, and js/geo.js and
// js/comcastify.js are fetched on demand by the terminal instead of bundled.
const staticAssets = [
  "favicon.png",
  "welcome.htm",
  "css/bootstrap.css",
  "css/pages.css",
  "css/styles.css",
  "images",
  "videos",
  "config/commands.js",
  "config/firm.js",
  "config/portfolio.js",
  "config/team.js",
  "js/comcastify.js",
  "js/geo.js",
];

async function minifyJavaScript(source, options = {}) {
  const result = await minify(source, {
    compress: {
      passes: 2,
    },
    mangle: true,
    ...options,
  });

  if (!result.code) {
    throw new Error("Terser did not return output");
  }

  return result.code;
}

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function writeText(relativePath, content) {
  const absolutePath = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

// Static files that ship as-is. Anything not listed here (scripts/, tests/,
// package.json, netlify.toml, the unbundled js/ sources) stays out of the
// publish directory and off the public site.
function copyStaticAssets() {
  for (const asset of staticAssets) {
    fs.cpSync(path.join(rootDir, asset), path.join(outDir, asset), {
      recursive: true,
    });
  }
  console.log(`static assets: ${staticAssets.length} paths copied`);
}

// dist/ is rebuilt from scratch every time, so a file that stops being
// generated cannot linger and keep getting deployed.
function resetOutDir() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
}

async function copyVendorScript(asset) {
  const source = readText(asset.src);
  let output = source;

  if (asset.minify) {
    const minified = await minifyJavaScript(source);
    if (minified.length < source.length) {
      output = minified;
    }
  }

  writeText(asset.dest, output);
  console.log(`${asset.dest}: ${source.length} -> ${output.length} bytes`);
}

async function buildAppBundle() {
  const source = appBundleSources
    .map((file) => `// ${file}\n${readText(file)}`)
    .join("\n;\n");
  const output = await minifyJavaScript(source, {
    compress: {
      passes: 2,
      unsafe_arrows: false,
    },
  });

  writeText("js/app.bundle.js", output);
  console.log(`js/app.bundle.js: ${source.length} -> ${output.length} bytes`);
}

async function buildRickRollBundle() {
  const source = readText("js/rickroll.js");
  const output = await minifyJavaScript(source);
  writeText("js/rickroll.min.js", output);
  console.log(`js/rickroll.min.js: ${source.length} -> ${output.length} bytes`);
}

function copyXtermCss() {
  const cssSource = path.join(
    rootDir,
    "node_modules/@xterm/xterm/css/xterm.css"
  );
  const cssTarget = path.join(outDir, "css/xterm.css");

  fs.mkdirSync(path.dirname(cssTarget), { recursive: true });
  fs.copyFileSync(cssSource, cssTarget);
  console.log("css/xterm.css copied");
}

async function main() {
  resetOutDir();
  copyStaticAssets();
  copyXtermCss();

  for (const asset of vendorScripts) {
    await copyVendorScript(asset);
  }

  await buildAppBundle();
  await buildRickRollBundle();

  // The crawlable static mirror, plus dist/index.html. Part of `npm run build`
  // so every Netlify deploy regenerates it from the current config/*.js.
  writePages();
}

module.exports = { appBundleSources, main, staticAssets, vendorScripts };

// Guarded so tests can import the bundle order without triggering a build.
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
