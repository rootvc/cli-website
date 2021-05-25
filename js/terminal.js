function runRootTerminal(term) {
  if (term._initialized) {
    return;
  }

  term.history = [];
  term.historyCursor = -1;
  term.promptChar = '\x1b[1;32m$\x1b[0;38m ';

  term.prompt = () => {
    term.write(`\r\n${term.promptChar}`);
  };

  term.clearCurrentLine = () => {
    term.write('\x1b[2K\r');
    term.write(term.promptChar);
    term.currentLine = "";
  };

  term.stylePrint = (text) => {
    // Text Wrap
    text = wordWrap(text, term.cols);

    // Hyperlinks
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urlMatches = text.matchAll(urlRegex);
    for (match of urlMatches) {
      text = text.replace(match[0], colorText(match[0], "hyperlink"));
    }
    // Commands
    const cmds = Object.keys(commands);
    for (cmd of cmds) {
      const cmdMatches = text.matchAll(`%${cmd}%`);
      for (match of cmdMatches) {
        text = text.replace(match[0], colorText(cmd, "command"));
      }  
    }

    term.writeln(text);
  };

  term.printArt = (id) => {
    if (term.cols >= 40) {
      term.writeln(`\r\n${getArt(id)}\r\n`);
    }
  }

  term.printLogoType = () => {
    term.writeln(term.cols >= 40 ? LOGO_TYPE : "[Root Ventures]\r\n");
  }

  const init = function() {
    fitAddon.fit();
    preloadASCIIArt();
    term.reset();
    term.printLogoType();
    term.stylePrint('Welcome to the Root Ventures terminal. Seeding bold engineers!');
    term.stylePrint(`Type ${colorText("help", "command")} to get started.`);
    term.focus();
  };

  // try term.onResize
  window.addEventListener('resize', function () {
    term._initialized = false;
    init();
    for (c of term.history) {
      term.writeln(`\r\n${term.promptChar} ${c}\r\n`);
      command(c);
    }
    term.prompt();
    term.scrollToBottom();
    term._initialized = true;
  });

  term.onData(e => {
    const pos = term._core.buffer.x - 2;
    var h = [... term.history];
    h.reverse();

    switch (e) {
      case '\r': // Enter
        term.writeln("");

        if (term.currentLine.length > 0) {
          term.history.push(term.currentLine);
          term.currentLine = term.currentLine.trim();
          command(term.currentLine);

          const tokens = term.currentLine.split(" ");
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            "event": "command",
            "command": tokens.shift(),
            "args": tokens.join(" "),
          });
        }
        term.prompt();
        term.currentLine = ""; // TODO: clearCurrentLine? And add historyCursor = -1 there?
        term.historyCursor = -1;
        term.scrollToBottom();
        break;
      case '\u0001': // Ctrl+A
        term.write('\x1b[D'.repeat(pos));
        break;
      case '\u0005': // Ctrl+E
        if (pos < term.currentLine.length) {
          term.write('\x1b[C'.repeat(term.currentLine.length - pos));
        }
        break;
      case '\u0003': // Ctrl+C
        term.currentLine = "";
        term.historyCursor = -1;
        term.prompt();
        break;
      case '\u0008': // Ctrl+H
      case '\u007F': // Backspace (DEL)
        term.currentLine = term.currentLine.substring(0, term.currentLine.length - 1);
        // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          term.write('\b \b');
        }
        break;
      case '\033[A': // up
        if (term.historyCursor < h.length - 1) {
          term.historyCursor += 1;
          term.clearCurrentLine();
          term.currentLine = h[term.historyCursor];
          term.write(term.currentLine);
        }
        break;
      case '\033[B': // down
        if (term.historyCursor > 0) {
          term.historyCursor -= 1;
          term.clearCurrentLine();
          term.currentLine = h[term.historyCursor];
          term.write(term.currentLine);
        } else {
          term.clearCurrentLine();
          term.historyCursor = -1;
        }
        break;
      case '\033[C': // right
        if (term._core.buffer.x - 2 < term.currentLine.length) {
          term.write('\x1b[C');
        }
        break;
      case '\033[D': // left
        if (term._core.buffer.x > 2) {
          term.write('\x1b[D');
        }
        break;
      default: // Print all other characters
        const length = term.currentLine.length;
        const newLine = `${term.currentLine.slice(0, pos)}${e}${term.currentLine.slice(pos)}`;

        term.clearCurrentLine();
        term.currentLine = newLine;
        term.write(newLine);
        term.write('\x1b[D'.repeat(length - pos));
    }
  });

  init();
  // These 3 things are not always called when we reinitialize
  term.prompt();
  term._initialized = true;
  term.clearCurrentLine();
}

function openURL(url) {
  term.stylePrint(`Opening ${url}`);
  if (term._initialized) {
    window.open(url, "_blank");
  }
}

function displayURL(url) {
  term.stylePrint(colorText(url, "hyperlink"));
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
