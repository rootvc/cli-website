// TODO: make this a proper addon
extend = (term) => {
  term.currentLine = "";
  term.user = "guest";
  term.host = "rootpc";
  term.cwd = "~";
  term.sep = ":";
  term._promptChar = "$";
  term.history = [];
  term.historyCursor = -1;
  term.pos = () => term._core.buffer.x - term._promptRawText().length - 1;
  term._promptRawText = () => `${term.user}${term.sep}${term.host} ${term.cwd} $`;

  term.promptText = () => {
    var text = term._promptRawText().replace(term.user, colorText(term.user, "user"))
      .replace(term.sep, colorText(term.sep, ""))
      .replace(term.host, colorText(term.host, ""))
      .replace(term.cwd, colorText(term.cwd, "hyperlink"))
      .replace(term._promptChar, colorText(term._promptChar, "prompt"));
    return text;
  }

  term.prompt = (prefix = "\r\n", suffix = " ") => {
    term.write(`${prefix}${term.promptText()}${suffix}`);
  };

  term.clearCurrentLine = (goToEndofHistory = false) => {
    term.write('\x1b[2K\r');
    term.prompt("", " ");
    term.currentLine = "";
    if (goToEndofHistory) {
      term.historyCursor = -1;
      term.scrollToBottom();
    }
  };

  term.setCurrentLine = (newLine, preserveCursor = false) => {
    const length = term.currentLine.length;
    term.clearCurrentLine();
    term.currentLine = newLine;
    term.write(newLine);
    if (preserveCursor) {
      term.write('\x1b[D'.repeat(length - term.pos()));
    }
  }

  term.stylePrint = (text) => {
    // Text Wrap
    text = _wordWrap(text, term.cols);

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

  term.openURL = (url) => {
    term.stylePrint(`Opening ${url}`);
    if (term._initialized) {
      window.open(url, "_blank");
    }
  }

  term.displayURL = (url) => {
    term.stylePrint(colorText(url, "hyperlink"));
  }

  term.command = (line) => {
    const parts = line.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1, parts.length).map((el) => el.trim());
    const fn = commands[cmd];
    if (typeof(fn) === "undefined") {
      term.stylePrint(`Command not found: ${cmd}. Try 'help' to get started.`);
    } else {
      fn(args);
    }
  }
}

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
// TODO: This should treat \r\n as a newline
function _wordWrap(str, maxWidth) {
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
