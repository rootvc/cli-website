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
  // Load local files immediately as they're already available
  for (kv of Object.entries(_LOCAL_FILES)) {
    _insertFileToDOM(kv[0], kv[1]);
  }

  // Load remote files asynchronously with delays to avoid blocking
  const remoteFiles = Object.entries(_REMOTE_FILES);
  let index = 0;
  
  function loadNextFile() {
    if (index < remoteFiles.length) {
      _loadFile(remoteFiles[index][0]);
      index++;
      setTimeout(loadNextFile, 100);
    }
  }
  
  // Start loading remote files after a delay
  if (remoteFiles.length > 0) {
    setTimeout(loadNextFile, 50);
  }
}

function _loadFile(name) {
  fetch(_REMOTE_FILES[name])
    .then(response => response.text())
    .then((body) => _insertFileToDOM(name, body));
}

function _insertFileToDOM(name, txt) {
  const parentDiv = document.getElementById("files-all");
  div = document.createElement("div");
  div.id = name;
  div.innerText = txt;
  parentDiv.appendChild(div);
}

function getFileContents(filename) {
  console.log(filename);
  const div = document.getElementById(filename);
  return div.innerHTML
    .replaceAll("<br>", "\r\n")
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<");
}
