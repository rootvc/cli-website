const _LOCAL_FILES = {
  "id_rsa": "Nice try!",
};

const _REMOTE_FILES = {
  "README.md": "https://raw.githubusercontent.com/rootvc/cli-website/main/README.md",
  "welcome.htm": "https://raw.githubusercontent.com/rootvc/cli-website/main/welcome.htm",
};

const _FILES = {
  ..._LOCAL_FILES,
  ..._REMOTE_FILES,
}

const _DIRS = {
  "~": ["id_rsa", "welcome.htm", "README.md"],
  "bin": ["zsh"],
  "home": Object.keys(team).concat("guest", "root").sort(),
  "/": ["bin", "home"],
};

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

function preloadFiles() {
  for (kv of Object.entries(_REMOTE_FILES)) {
    _loadFile(kv[0]);
  }

  for (kv of Object.entries(_LOCAL_FILES)) {
    _insertFileToDOM(kv[0], kv[1]);
  }
}

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
