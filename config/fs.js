const _LOCAL_FILES = {
  "id_rsa": "Nice try!",
};

const _REMOTE_FILES = {
  "README.md": "https://raw.githubusercontent.com/rootvc/cli-website/main/README.md",
};

const DIRS = {
  "~": ["id_rsa", "README.md"],
  "bin": ["zsh"],
  "home": Object.keys(team).concat("guest", "root").sort(),
  "/": ["bin", "home"],
};

function preloadFiles() {
  for (kv of Object.entries(_REMOTE_FILES)) {
    _loadFile(kv[0]);
  }

  for (kv of Object.entries(_LOCAL_FILES)) {
    _insertFileToDOM(kv[0], kv[1]);
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
  const div = document.getElementById(filename);
  return div.innerHTML.replaceAll("<br>", "\r\n");
}
