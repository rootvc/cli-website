function runRootTerminal(term) {
  if (term._initialized) {
    return;
  }

  term.init();
  term._initialized = true;
  term.locked = false;

  window.onload = (_) => {
    term.prompt();
    term.runDeepLink();

    window.addEventListener("resize", term.resizeListener);

    term.onData(e => {
      if (term._initialized && !term.locked) {
        switch (e) {
          case '\r': // Enter
            var exitStatus;
            term.currentLine = term.currentLine.trim();
            const tokens = term.currentLine.split(" ");
            const cmd = tokens.shift();
            const args = tokens.join(" ");

            term.writeln("");

            if (term.currentLine.length > 0) {
              term.history.push(term.currentLine);
              exitStatus = term.command(term.currentLine);

              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                "event": "commandSent",
                "command": cmd,
                "args": args,
              });
            }

            if (exitStatus != 1) {
              term.prompt();
              term.clearCurrentLine(true);
            }
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
            term.prompt();
            term.clearCurrentLine(true);
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
            var h = [...term.history].reverse();
            if (term.historyCursor < h.length - 1) {
              term.historyCursor += 1;
              term.setCurrentLine(h[term.historyCursor], false);
            }
            break;
          case '\033[B': // down
            var h = [...term.history].reverse();
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
          case '\t': // tab
            cmd = term.currentLine.split(" ")[0];
            const rest = term.currentLine.slice(cmd.length).trim();
            const autocompleteCmds = Object.keys(commands).filter((c) => c.startsWith(cmd));
            var autocompleteArgs;

            // detect what to autocomplete
            if (autocompleteCmds && autocompleteCmds.length > 1) {
              const oldLine = term.currentLine;
              term.stylePrint(`\r\n${autocompleteCmds.sort().join("   ")}`);
              term.prompt();
              term.setCurrentLine(oldLine);
            } else if (["cat", "tail", "less", "head", "open", "mv", "cp", "chown", "chmod"].includes(cmd)) {
              autocompleteArgs = _filesHere().filter((f) => f.startsWith(rest));
            } else if (["whois", "finger", "groups"].includes(cmd)) {
              autocompleteArgs = Object.keys(team).filter((f) => f.startsWith(rest));
            } else if (["man", "woman", "tldr"].includes(cmd)) {
              autocompleteArgs = Object.keys(portfolio).filter((f) => f.startsWith(rest));
            } else if (["cd"].includes(cmd)) {
              autocompleteArgs = _filesHere().filter((dir) => dir.startsWith(rest) && !_DIRS[term.cwd].includes(dir));
            }

            // do the autocompleting
            if (autocompleteArgs && autocompleteArgs.length > 1) {
              const oldLine = term.currentLine;
              term.writeln(`\r\n${autocompleteArgs.join("   ")}`);
              term.prompt();
              term.setCurrentLine(oldLine);
            } else if (commands[cmd] && autocompleteArgs && autocompleteArgs.length > 0) {
              term.setCurrentLine(`${cmd} ${autocompleteArgs[0]}`);
            } else if (commands[cmd] && autocompleteArgs && autocompleteArgs.length == 0) {
              term.setCurrentLine(`${cmd} ${rest}`);
            } else if (autocompleteCmds && autocompleteCmds.length == 1) {
              term.setCurrentLine(`${autocompleteCmds[0]} `);
            }
            break;
          default: // Print all other characters
            const newLine = `${term.currentLine.slice(0, term.pos())}${e}${term.currentLine.slice(term.pos())}`;
            term.setCurrentLine(newLine, true);
            break;
        }
        term.scrollToBottom();
      }
    });
  };

}

function colorText(text, color) {
  const colors = {
    "command": "\x1b[1;35m",
    "hyperlink": "\x1b[1;34m",
    "user": "\x1b[1;33m",
    "prompt": "\x1b[1;32m",
    "bold": "\x1b[1;37m"
  }
  return `${colors[color] || ""}${text}\x1b[0;38m`;
}
