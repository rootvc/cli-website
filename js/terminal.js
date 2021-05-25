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
    const pos = term._core.buffer.x - 2;
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
        term.currentLine = ""; // TODO: call clearCurrentLine instead? And add historyCursor = -1 there?
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
        // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          const newLine = term.currentLine.slice(0, pos - 1) + term.currentLine.slice(pos);
          term.clearCurrentLine();
          term.currentLine = newLine;
          term.write(newLine);
          term.write('\x1b[D'.repeat(newLine.length - pos + 1));
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
  // These 3 things are called on init, but are not always called during re-init
  term.prompt();
  term._initialized = true;
  term.clearCurrentLine();
}
