function runRootTerminal() {
  if (term._initialized) {
    return;
  }

  term._initialized = true;

  term.prompt = () => {
    term.write('\r\n$ ');
  };

  term.writeln('Welcome to Root Ventures terminal!');
  term.writeln("Type 'help' to get started.");
  term.writeln('');
  prompt(term);

  var currentLine = "";

  term.onData(e => {
    switch (e) {
      case '\r': // Enter
        if (currentLine.length > 0) {
          term.writeln("");
          command(currentLine);
        }
      case '\u0003': // Ctrl+C
        currentLine = "";
        prompt(term);
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

function prompt(term) {
  term.write('\r\n$ ');
}

function openURL(url) {
  term.writeln("Opening " + url);
  window.open(url, "_blank");
}

function command(cmd) {
  console.log(cmd);
  const fn = commands[cmd];
  if (typeof(fn) === "undefined") {
    term.writeln("Command not found.");
  } else {
    fn();
  }
}