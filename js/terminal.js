function runRootTerminal(term) {
  if (term._initialized) {
    return;
  }

  term.init = () => {
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
    term.init();
    for (c of term.history) {
      term.prompt("\r\n", ` ${c}\r\n`);
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
        term.write('\x1b[D'.repeat(term.pos()));
        break;
      case '\u0005': // Ctrl+E
        if (term.pos() < term.currentLine.length) {
          term.write('\x1b[C'.repeat(term.currentLine.length - term.pos()));
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
        if (term.pos() > 0) {
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
        if (term.pos() < term.currentLine.length) {
          term.write('\x1b[C');
        }
        break;
      case '\033[D': // left
        if (term.pos() > 0) {
          term.write('\x1b[D');
        }
        break;
      default: // Print all other characters
        const newLine = `${term.currentLine.slice(0, term.pos())}${e}${term.currentLine.slice(term.pos())}`;
        term.setCurrentLine(newLine, true);
    }
    term.scrollToBottom();
  });

  term.init();
  // These 3 things are called on init, but are not always called during re-init
  term.prompt();
  term._initialized = true;
}

function colorText(text, color) {
  const colors = {
    "command": "\x1b[1;35m",
    "hyperlink": "\x1b[1;34m",
    "user": "\x1b[1;33m",
    "prompt": "\x1b[1;32m",
  }
  return `${colors[color] || ""}${text}\x1b[0;38m`;
}
