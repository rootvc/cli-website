function runRootTerminal(term) {
  if (term._initialized) {
    return;
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

  window.addEventListener('resize', function () {
    term._initialized = false;
    init();
    for (c of term.history) {
      term.writeln(`\r\n${term.promptChar} ${c}\r\n`);
      term.command(c);
    }
    term.prompt();
    term.scrollToBottom();
    term._initialized = true;
  });

  term.onData(e => {
    var h = [... term.history];
    h.reverse();

    switch (e) {
      case '\r': // Enter
        term.writeln("");

        if (term.currentLine.length > 0) {
          term.history.push(term.currentLine);
          term.currentLine = term.currentLine.trim();
          term.command(term.currentLine);

          const tokens = term.currentLine.split(" ");
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            "event": "command",
            "command": tokens.shift(),
            "args": tokens.join(" "),
          });
        }
        term.prompt();
        term.clearCurrentLine(true);
        break;
      case '\u0001': // Ctrl+A
        term.write('\x1b[D'.repeat(pos));
        break;
      case '\u0005': // Ctrl+E
        if (term.pos() < term.currentLine.length) {
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
        // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          const newLine = term.currentLine.slice(0, term.pos() - 1) + term.currentLine.slice(term.pos());
          term.setCurrentLine(newLine, true)
        }
        break;
      case '\033[A': // up
        if (term.historyCursor < h.length - 1) {
          term.historyCursor += 1;
          term.setCurrentLine(h[term.historyCursor], false);
        }
        break;
      case '\033[B': // down
        if (term.historyCursor > 0) {
          term.historyCursor -= 1;
          term.setCurrentLine(h[term.historyCursor], false);
        } else {
          term.clearCurrentLine(true);
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
        const newLine = `${term.currentLine.slice(0, term.pos())}${e}${term.currentLine.slice(term.pos())}`;
        term.setCurrentLine(newLine, true);
    }
    term.scrollToBottom();
  });

  init();
  // These 3 things are called on init, but are not always called during re-init
  term.prompt();
  term._initialized = true;
  term.clearCurrentLine(true);
}

function colorText(text, color) {
  const colors = {
    "command": "\x1b[1;35m",
    "hyperlink": "\x1b[1;34m",
    "files": "\x1b[1;33m",
  }
  return `${colors[color] || ""}${text}\x1b[0;38m`;
}
