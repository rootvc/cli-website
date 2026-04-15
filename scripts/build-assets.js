const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const rootDir = path.resolve(__dirname, "..");

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

const appBundleSources = [
  "js/terminal.js",
  "js/terminal-ext.js",
  "js/ascii-art.js",
  "config/help.js",
  "config/portfolio.js",
  "config/team.js",
  "config/commands.js",
  "config/fs.js",
  "config/jobs.js",
  "js/bootstrap.js",
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
  const absolutePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
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
  const cssTarget = path.join(rootDir, "css/xterm.css");

  fs.mkdirSync(path.dirname(cssTarget), { recursive: true });
  fs.copyFileSync(cssSource, cssTarget);
  console.log("css/xterm.css copied");
}

async function main() {
  copyXtermCss();

  for (const asset of vendorScripts) {
    await copyVendorScript(asset);
  }

  await buildAppBundle();
  await buildRickRollBundle();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
