function runRootTerminal(term) {
  if (term._initialized) {
    return;
  }

  term._initialized = true;

  const callback = function(ascii) {
    term.writeln(ascii);
    term.writeln("\r\n");
    term.writeln('Welcome to Root Ventures terminal. Seeding bold engineers!');
    term.writeln("Type 'help' to get started.");
    prompt(term);
  };

  drawAsciiThen("/images/rootvc.png", 1.0, 0.5, callback);

  var currentLine = "";

  term.onData(e => {
    switch (e) {
      case '\r': // Enter
        if (currentLine.length > 0) {
          term.writeln("\n");
          command(currentLine);
        }
        // command is handled async (e.g. uses ASCII art), so must responsible for own prompt on completion
        if (!(currentLine.startsWith("tldr") || currentLine.startsWith("whois"))) {
          prompt(term);
        }
        currentLine = "";
        break;
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

function prompt(term) {
  term.write("\x1b[1;32m\r\n$ \x1b[0;38m");
}

function openURL(url) {
  term.writeln(`Opening ${url}`);
  window.open(url, "_blank");
}

function command(line) {
  const parts = line.toLowerCase().split(" ");
  const cmd = parts[0];
  const args = parts.slice(1, parts.length);
  const fn = commands[cmd];
  if (typeof(fn) === "undefined") {
    term.writeln(`Command not found: ${cmd}. Try 'help' to get started.`);
  } else {
    fn(args);
  }
}