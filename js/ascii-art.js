const LOGO_TYPE =
` _____                                 
|  __ \\            _                   
| |__) |___   ___ | |_                  
|  _  // _ \\ / _ \\| __|                 
| | \\ | (_) | (_) | |_                  
|_|  \\_\\___/ \\___/_\\__|                 
__    __         _
\\ \\  / /__ _ __ | |_ _   _ _ __ ___ ___ 
 \\ \\/ / _ | '_ \\| __| | | | '__/ _ / __|
  \\  |  __| | | | |_| |_| | | |  __\\__ \\
   \\/ \\___|_| |_|\\__|\\__,_|_|  \\___|___/

`.replaceAll("\n", "\r\n");

let asciiArtPreloadPromise = null;
let asciiArtLoadPromises = {};

function isASCIIArtLoaded(id) {
  const div = document.getElementById(id);
  return div ? div.dataset.loaded === "true" : false;
}

function _asciiArtScale() {
  return term.cols >= 60 ? 0.5 : 1.0;
}

function _getASCIIArtSpec(id) {
  if (id === "rootvc-square") {
    return [id, 1.0, _asciiArtScale(), "png", false];
  }

  if (team[id]) {
    return [id, 1.0, _asciiArtScale(), "png", true];
  }

  if (portfolio[id]) {
    return [id, 0.5, 1.0, "jpg", false];
  }

  return null;
}

function getASCIIArtIdForCommand(cmd, args) {
  const name = args[0];

  if (cmd === "whois" && term.cols >= 40) {
    if (name === "root") {
      return "rootvc-square";
    }

    if (team[name]) {
      return name;
    }
  }

  if (cmd === "tldr" && term.cols >= 60 && portfolio[name]) {
    return name;
  }

  return null;
}

function _queueASCIIArtWork(task, timeout = 1000) {
  if (typeof window.scheduleIdleTask === "function") {
    window.scheduleIdleTask(task, timeout);
  } else {
    window.setTimeout(task, timeout);
  }
}

function preloadASCIIArt() {
  if (asciiArtPreloadPromise) {
    return asciiArtPreloadPromise;
  }

  const specs = [
    _getASCIIArtSpec("rootvc-square"),
    ...Object.keys(team).map((person) => _getASCIIArtSpec(person)),
    ...Object.keys(portfolio).map((company) => _getASCIIArtSpec(company)),
  ].filter(Boolean);

  asciiArtPreloadPromise = window
    .ensureAALibLoaded()
    .then(
      () =>
        new Promise((resolve) => {
          let index = 0;

          const loadNextBatch = () => {
            const batch = specs.slice(index, index + 2).map((spec) => spec[0]);
            index += batch.length;

            if (batch.length === 0) {
              resolve();
              return;
            }

            Promise.all(batch.map((id) => ensureASCIIArt(id))).finally(() => {
              if (index < specs.length) {
                _queueASCIIArtWork(loadNextBatch, 1000);
              } else {
                resolve();
              }
            });
          };

          loadNextBatch();
        })
    )
    .catch((error) => {
      console.warn("Failed to preload ASCII art", error);
    })
    .finally(() => {
      asciiArtPreloadPromise = null;
    });

  return asciiArtPreloadPromise;
}

function ensureASCIIArt(id) {
  const spec = _getASCIIArtSpec(id);
  if (!spec || isASCIIArtLoaded(id)) {
    return Promise.resolve();
  }

  if (asciiArtLoadPromises[id]) {
    return asciiArtLoadPromises[id];
  }

  asciiArtLoadPromises[id] = window
    .ensureAALibLoaded()
    .then(() => _loadArt(...spec))
    .finally(() => {
      delete asciiArtLoadPromises[id];
    });

  return asciiArtLoadPromises[id];
}

// TODO: Here is where we should insert alternatives to ASCII as text
function _loadArt(id, ratio, scale, ext, inverse, callback) {
  const parentDiv = document.getElementById("aa-all");
  const width = Math.floor(term.cols * scale);
  const height = Math.floor(width / 2 * ratio);
  var filename = `/images/${id}.${ext}`;

  var div = document.getElementById(id);
  
  if (!div) {
    div = document.createElement("div");
    div.id = id;
    parentDiv.appendChild(div);
  }

  if (isASCIIArtLoaded(id)) {
    return Promise.resolve();
  }

  div.dataset.loaded = "false";

  return new Promise((resolve) => {
    if (term.cols >= 40) {
      const NICE_CHARSET = aalib.charset.SIMPLE_CHARSET + " ";
      var aa = aalib.read.image.fromURL(filename)
        .map(aalib.aa({ width: width, height: height }));
      if (inverse) {
        aa = aa.map(aalib.filter.inverse());
      }
      aa.map(
        aalib.render.html({
          el: div,
          charset: NICE_CHARSET,
        })
      ).subscribe(() => {
        div.dataset.loaded = "true";
        if (callback) {
          callback();
        }
        resolve();
      });
    } else {
      div.innerText = `[ Photo: ${document.location.href}images/${id}.${ext} ]`;
      div.dataset.loaded = "true";
      if (callback) {
        callback();
      }
      resolve();
    }
  });
}

function getArt(id) {
  const div = document.getElementById(id);
  return isASCIIArtLoaded(id) ? div.innerText.replaceAll("\n", "\n\r") : "";
}
