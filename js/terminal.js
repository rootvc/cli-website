function runRootTerminal(term) {
  if (term._initialized) {
    return;
  }

  term.prompt = () => {
    term.write('\r\n\x1b[1;32m$\x1b[0;38m ');
  };

  term.stylePrint = (text) => {
    // Hyperlinks
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urlMatches = text.matchAll(urlRegex);
    for (match of urlMatches) {
      text = text.replace(match[0], colorText(match[0], "hyperlink"));
    }

    // Commands
    const cmds = Object.keys(commands);
    for (cmd of cmds) {
      const cmdMatches = text.matchAll(`(^${cmd}|^other)`);
      for (match of cmdMatches) {
        text = text.replace(match[0], colorText(match[0], "command"));
      }  
    }

    // Text Wrap
    text = wordWrap(text, term.cols);

    term.writeln(text);
  };

  term._initialized = true;

  const callback = function(ascii) {
    term.stylePrint(ascii);
    term.stylePrint("\r\n");
    term.stylePrint('Welcome to Root Ventures terminal. Seeding bold engineers!');
    term.stylePrint(`Type ${colorText("help", "command")} to get started.`);
    term.prompt();
  };

  drawAsciiThen("/images/rootvc.png", 1.0, 0.5, callback);

  var currentLine = "";

  term.onData(e => {
    switch (e) {
      case '\r': // Enter
        currentLine = currentLine.trim();
        if (currentLine.length > 0) {
          term.stylePrint("\n");
          command(currentLine);
        }
        // command is handled async (e.g. uses ASCII art), so must responsible for own prompt on completion
        if (!currentLine.match(/^(tldr|whois|man|woman)/)) {
          term.prompt();
        }
        currentLine = "";
        break;
      case '\u0003': // Ctrl+C
        currentLine = "";
        term.prompt();
        break;
      case '\u007F': // Backspace (DEL)
        currentLine = currentLine.substring(0, currentLine.length - 1);
        // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          term.write('\b \b');
        }
        break;
      case '\033[A':
      case '\033[B':
      case '\033[C':
      case '\033[D':
        break;
      default: // Print all other characters
        currentLine = currentLine.concat(e);
        term.write(e);
    }
  });
}

function drawAsciiThen(filename, ratio, scale, callback) {
  // callback is a function that must take the ascii image as a string parameter
  var newCallback = function() {
    const ascii = document.getElementById("aa-text").innerText.replaceAll("\n", "\n\r");
    callback(ascii);
  };
  const width = Math.floor(term.cols * scale);
  const height = Math.floor(width / 2 * ratio);

  aalib.read.image.fromURL(filename)
    .map(aalib.aa({ width: width, height: height }))
    .map(aalib.render.html({
      el: document.getElementById("aa-text")
    }))
    .subscribe(newCallback, function(err) {
      console.log(err);
      callback("[logo not found]");
    });
}

function openURL(url) {
  term.stylePrint(`Opening ${url}`);
  window.open(url, "_blank");
}

function displayURL(url) {
  term.stylePrint(`> ${colorText(url, "hyperlink")}`);
}

function command(line) {
  const parts = line.toLowerCase().split(" ");
  const cmd = parts[0];
  const args = parts.slice(1, parts.length).map((el) => el.trim());
  const fn = commands[cmd];
  if (typeof(fn) === "undefined") {
    term.stylePrint(`Command not found: ${cmd}. Try 'help' to get started.`);
  } else {
    fn(args);
  }
}

function colorText(text, color) {
  const colors = {
    "command": "\x1b[1;35m",
    "hyperlink": "\x1b[1;34m",
    "files": "\x1b[1;33m",
  }
  
  return `${colors[color] || ""}${text}\x1b[0;38m`;
}

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function wordWrap(str, maxWidth) {
  var newLineStr = "\r\n"; done = false; res = '';
  while (str.length > maxWidth) {
      found = false;
      // Inserts new line at first whitespace of the line
      for (i = maxWidth - 1; i >= 0; i--) {
          if (_testWhite(str.charAt(i))) {
              res = res + [str.slice(0, i), newLineStr].join('');
              str = str.slice(i + 1);
              found = true;
              break;
          }
      }
      // Inserts new line at maxWidth position, the word is too long to wrap
      if (!found) {
          res += [str.slice(0, maxWidth), newLineStr].join('');
          str = str.slice(maxWidth);
      }

  }

  return res + str;
}

function _testWhite(x) {
  var white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
};
