// fs.js — Virtual file system for the Root Ventures terminal.
//
// Since there's no real file system in the browser, files are stored as hidden
// <div> elements in the DOM (inside #files-all). Content is written to
// div.innerText on load and read back via div.innerHTML when accessed —
// the browser's HTML entity encoding/decoding is what necessitates the
// replaceAll() calls in getFileContents().
//
// Remote files (README.md, welcome.htm) are fetched from GitHub on first load
// and inserted into the DOM the same way. Local files are inserted directly.

// Files with hardcoded content that don't need to be fetched.
const _LOCAL_FILES = {
  "id_rsa": "Nice try!",
};

// Files fetched from GitHub at startup. The key is used as the DOM element ID.
const _REMOTE_FILES = {
  "README.md": "https://raw.githubusercontent.com/rootvc/cli-website/main/README.md",
  "welcome.htm": "https://raw.githubusercontent.com/rootvc/cli-website/main/welcome.htm",
};

// Combined map of all known files (used by `find`).
const _FILES = {
  ..._LOCAL_FILES,
  ..._REMOTE_FILES,
}

// Directory structure. "home" is populated dynamically from team.js so we
// don't have to update it when team members are added or removed.
const _DIRS = {
  "~": ["id_rsa", "welcome.htm", "README.md"],
  "bin": ["zsh"],
  "home": Object.keys(team).concat("guest", "root").sort(),
  "/": ["bin", "home"],
};

// Pre-compute absolute paths for every known file, used by `find`.
let _FULL_PATHS = {};
let _LOADING_FILES = {};
for (const [key, values] of Object.entries(_DIRS)) {
  for (const value of values) {
    switch (key) {
      case "~":
        _FULL_PATHS[value] = `${key}/${value}`;
        break;
      case "/":
        _FULL_PATHS[value] = `/${value}`;
        break;
      default:
        _FULL_PATHS[value] = `/${key}/${value}`;
    }
  }
}

// Called at terminal init to populate the DOM with file content.
function preloadFiles() {
  for (const name of Object.keys(_REMOTE_FILES)) {
    _loadFile(name);
  }

  for (const [name, content] of Object.entries(_LOCAL_FILES)) {
    _insertFileToDOM(name, content);
  }
}

// Fetches a remote file and inserts it into the DOM when ready.
function _loadFile(name) {
  if (document.getElementById(name)) {
    return Promise.resolve();
  }

  if (_LOADING_FILES[name]) {
    return _LOADING_FILES[name];
  }

  _LOADING_FILES[name] = fetch(_REMOTE_FILES[name])
    .then(response => response.text())
    .then((body) => _insertFileToDOM(name, body))
    .finally(() => {
      delete _LOADING_FILES[name];
    });

  return _LOADING_FILES[name];
}

function ensureFileLoaded(name) {
  if (!_FILES[name]) {
    return Promise.resolve();
  }

  if (document.getElementById(name)) {
    return Promise.resolve();
  }

  if (_REMOTE_FILES[name]) {
    return _loadFile(name);
  }

  if (_LOCAL_FILES[name]) {
    _insertFileToDOM(name, _LOCAL_FILES[name]);
  }

  return Promise.resolve();
}

function getPreloadFileForCommand(cmd, args) {
  const filename = args[0];
  if (!filename) {
    return null;
  }

  if (["cat", "grep"].includes(cmd) && _REMOTE_FILES[filename]) {
    return filename;
  }

  return null;
}

// Stores file content as the innerText of a <div id="{name}"> inside #files-all.
// innerText is used (vs innerHTML) so the content is treated as plain text and
// won't be interpreted as HTML markup.
function _insertFileToDOM(name, txt) {
  const parentDiv = document.getElementById("files-all");
  let div = document.getElementById(name);

  if (!div) {
    div = document.createElement("div");
    div.id = name;
    parentDiv.appendChild(div);
  }
  div.innerText = txt;
  return txt;
}

// Retrieves file content from the DOM. We read innerHTML (not innerText) because
// the browser HTML-encodes the plain text when it was written — innerHTML gives
// us the encoded form, which we then manually decode back to the original chars.
function getFileContents(filename) {
  const div = document.getElementById(filename);
  if (!div) {
    if (_REMOTE_FILES[filename]) {
      _loadFile(filename);
      return `Loading ${filename}. Try again in a moment.`;
    }

    return `File not found: ${filename}`;
  }

  return div.innerHTML
    .replaceAll("<br>", "\r\n")
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<");
}
