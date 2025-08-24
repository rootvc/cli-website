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
            // Reset tab state
            term.tabIndex = 0;
            term.tabOptions = [];
            term.tabBase = "";
            
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
            // Reset tab state
            term.tabIndex = 0;
            term.tabOptions = [];
            term.tabBase = "";
            
            term.prompt();
            term.clearCurrentLine(true);
            break;
          case '\u0008': // Ctrl+H
          case '\u007F': // Backspace (DEL)
            // Reset tab state
            term.tabIndex = 0;
            term.tabOptions = [];
            term.tabBase = "";
            
            // Do not delete the prompt
            if (term.pos() > 0) {
              const newLine = term.currentLine.slice(0, term.pos() - 1) + term.currentLine.slice(term.pos());
              term.setCurrentLine(newLine, true)
            }
            break;
          case '\033[A': // up
            // Reset tab state
            term.tabIndex = 0;
            term.tabOptions = [];
            term.tabBase = "";
            
            var h = [...term.history].reverse();
            if (term.historyCursor < h.length - 1) {
              term.historyCursor += 1;
              term.setCurrentLine(h[term.historyCursor], false);
            }
            break;
          case '\033[B': // down
            // Reset tab state
            term.tabIndex = 0;
            term.tabOptions = [];
            term.tabBase = "";
            
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
            const tabParts = term.currentLine.split(" ");
            const tabCmd = tabParts[0];
            const tabRest = tabParts.slice(1).join(" ");
            
            // Check if we need to reset tab state (input changed)
            if (term.tabBase !== term.currentLine) {
              term.tabIndex = 0;
              term.tabOptions = [];
              term.tabBase = term.currentLine;
              
              // Get completions based on context
              if (tabParts.length === 1) {
                // Completing command
                term.tabOptions = Object.keys(commands).filter(c => c.startsWith(tabCmd)).sort();
              } else if (["cat", "tail", "less", "head", "open", "mv", "cp", "chown", "chmod", "ls"].includes(tabCmd)) {
                term.tabOptions = _filesHere().filter(f => f.startsWith(tabRest)).sort();
              } else if (["whois", "finger", "groups"].includes(tabCmd)) {
                term.tabOptions = Object.keys(team).filter(f => f.startsWith(tabRest)).sort();
              } else if (["man", "woman", "tldr"].includes(tabCmd)) {
                term.tabOptions = Object.keys(portfolio).filter(f => f.startsWith(tabRest)).sort();
              } else if (["cd"].includes(tabCmd)) {
                term.tabOptions = _filesHere().filter(dir => dir.startsWith(tabRest) && !_DIRS[term.cwd].includes(dir)).sort();
              }
            }
            
            // Handle tab completion
            if (term.tabOptions.length === 0) {
              // No completions
            } else if (term.tabOptions.length === 1) {
              // Single match - complete it
              if (tabParts.length === 1) {
                // Check if it's already an exact match (like typing "ls" completely)
                if (tabCmd === term.tabOptions[0]) {
                  // Exact match - just add a space
                  term.setCurrentLine(`${term.tabOptions[0]} `);
                } else {
                  // Partial match - complete it
                  term.setCurrentLine(`${term.tabOptions[0]} `);
                }
              } else {
                term.setCurrentLine(`${tabCmd} ${term.tabOptions[0]}`);
              }
              term.tabBase = "";
              term.tabIndex = 0;
              term.tabOptions = [];
            } else {
              // Multiple matches
              if (term.tabIndex === 0) {
                // First tab - show options
                term.writeln(`\r\n${term.tabOptions.join("   ")}`);
                term.prompt();
                term.setCurrentLine(term.currentLine);
                term.tabIndex = 1;
              } else {
                // Cycling through options
                const option = term.tabOptions[(term.tabIndex - 1) % term.tabOptions.length];
                if (tabParts.length === 1) {
                  term.setCurrentLine(option);
                } else {
                  term.setCurrentLine(`${tabCmd} ${option}`);
                }
                term.tabIndex++;
                term.tabBase = term.currentLine; // Update base to current selection
              }
            }
            break;
          default: // Print all other characters
            // Reset tab state on any other key
            term.tabIndex = 0;
            term.tabOptions = [];
            term.tabBase = "";
            
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
