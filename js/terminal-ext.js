// TODO: make this a proper addon

extend = (term) => {
  term.VERSION = term.VERSION || 3;
  term.currentLine = "";
  term.user = "guest";
  term.host = "rootpc";
  term.cwd = "~";
  term.sep = ":";
  term._promptChar = "$";
  term.history = [];
  term.historyCursor = -1;
  term.busy = false;
  term.pos = () => term._core.buffer.x - term._promptRawText().length - 1;
  term._promptRawText = () =>
    `${term.user}${term.sep}${term.host} ${term.cwd} $`;
  term.deepLink = window.location.hash.replace("#", "").split("-").join(" ");

  // Simple tab completion state
  term.tabIndex = 0;
  term.tabOptions = [];
  term.tabBase = "";

  term.promptText = () => {
    var text = term
      ._promptRawText()
      .replace(term.user, colorText(term.user, "user"))
      .replace(term.sep, colorText(term.sep, ""))
      .replace(term.host, colorText(term.host, ""))
      .replace(term.cwd, colorText(term.cwd, "hyperlink"))
      .replace(term._promptChar, colorText(term._promptChar, "prompt"));
    return text;
  };

  term.timer = (ms) => new Promise((res) => setTimeout(res, ms));

  term.dottedPrint = async (phrase, n, newline = true) => {
    term.write(phrase);

    for (let i = 0; i < n; i++) {
      await term.delayPrint(".", 1000);
    }
    if (newline) {
      term.write("\r\n");
    }
  };

  term.progressBar = async (t, msg) => {
    var r;

    if (msg) {
      term.write(msg);
    }
    term.write("\r\n[");

    for (let i = 0; i < term.cols / 2; i = i + 1) {
      r = Math.round((Math.random() * t) / 20);
      t = t - r;
      await term.delayPrint("█", r);
    }
    term.write("]\r\n");
  };

  term.delayPrint = async (str, t) => {
    await term.timer(t);
    term.write(str);
  };

  term.delayStylePrint = async (str, t, wrap) => {
    await term.timer(t);
    term.stylePrint(str, wrap);
  };

  term.prompt = (prefix = "\r\n", suffix = " ") => {
    term.write(`${prefix}${term.promptText()}${suffix}`);
  };

  term.clearCurrentLine = (goToEndofHistory = false) => {
    term.write("\x1b[2K\r");
    term.prompt("", " ");
    term.currentLine = "";
    if (goToEndofHistory) {
      term.historyCursor = -1;
      term.scrollToBottom();
    }
  };

  term.setCurrentLine = (newLine, preserveCursor = false) => {
    // Something with the new xterm package is messing up the location of term.pos() right after the clearCurrentLine()
    // Because of this, we need to collect the position beforehand.
    const oldPos = term.pos();
    const length = term.currentLine.length;
    term.clearCurrentLine();
    term.currentLine = newLine;
    term.write(newLine);
    if (preserveCursor) {
      // term.write("\x1b[D".repeat(length - term.pos()));
      term.write("\x1b[D".repeat(length - oldPos));
    }
  };

  term.stylePrint = (text, wrap = true) => {
    // Hyperlinks
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,24}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urlMatches = text.matchAll(urlRegex);
    let allowWrapping = true;
    for (match of urlMatches) {
      allowWrapping = match[0].length < 76;
      text = text.replace(match[0], colorText(match[0], "hyperlink"));
    }

    // Text Wrap
    if (allowWrapping && wrap) {
      text = _wordWrap(text, Math.min(term.cols, 76));
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
      const art = getArt(id);
      if (art) {
        term.writeln(`\r\n${art}\r\n`);
      } else {
        ensureASCIIArt(id);
      }
    }
  };

  term.printLogoType = () => {
    term.writeln(term.cols >= 40 ? LOGO_TYPE : "[Root Ventures]\r\n");
  };

  term.openURL = (url, newWindow = true) => {
    term.stylePrint(`Opening ${url}`);
    if (term._initialized) {
      console.log(newWindow);
      if (newWindow) {
        window.open(url, "_blank");
      } else {
        window.location.href = url;
      }
    }
  };

  term.displayURL = (url) => {
    term.stylePrint(colorText(url, "hyperlink"));
  };

  term.command = (line) => {
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1, parts.length);
    const fn = commands[cmd];
    if (typeof fn === "undefined") {
      term.stylePrint(`Command not found: ${cmd}. Try 'help' to get started.`);
    } else {
      return fn(args);
    }
  };

  term.parseCommandLine = (line) => {
    const trimmedLine = line.trim();
    const parts = trimmedLine ? trimmedLine.split(/\s+/) : [""];
    return {
      line: trimmedLine,
      cmd: (parts[0] || "").toLowerCase(),
      args: parts.slice(1),
    };
  };

  term.normalizeCommandForPreload = (cmd, args) => {
    switch (cmd) {
      case "man":
      case "woman":
        return { cmd: "tldr", args };
      case "tail":
      case "less":
      case "head":
      case "more":
        return { cmd: "cat", args };
      case "open":
        if (!args.length) {
          return { cmd, args };
        }

        if (
          (args[0].split(".")[0] == "test" && args[0].split(".")[1] == "htm") ||
          args[0].split(".")[1] == "htm" ||
          args.join(" ") == "the pod bay doors"
        ) {
          return { cmd, args };
        }

        return { cmd: "cat", args };
      default:
        return { cmd, args };
    }
  };

  term.preloadCommandAssets = async (line) => {
    const parsed = term.parseCommandLine(line);
    const normalized = term.normalizeCommandForPreload(parsed.cmd, parsed.args);
    const tasks = [];
    const artId = getASCIIArtIdForCommand(normalized.cmd, normalized.args);
    const preloadFile = getPreloadFileForCommand(normalized.cmd, normalized.args);

    if (artId) {
      tasks.push(ensureASCIIArt(artId));
    }

    if (preloadFile) {
      tasks.push(ensureFileLoaded(preloadFile));
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  };

  term.executeCommandLine = async (line, options = {}) => {
    const settings = {
      addToHistory: true,
      manageBusy: true,
      promptAfter: true,
      showLeadingNewline: true,
      trackAnalytics: true,
      ...options,
    };
    const parsed = term.parseCommandLine(line);
    let exitStatus;

    try {
      if (settings.manageBusy) {
        term.busy = true;
      }

      await term.preloadCommandAssets(parsed.line);

      if (settings.showLeadingNewline && parsed.cmd != "upgrade") {
        term.writeln("");
      }

      if (parsed.line.length > 0) {
        if (settings.addToHistory) {
          term.history.push(parsed.line);
        }

        exitStatus = term.command(parsed.line);

        if (settings.trackAnalytics) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "commandSent",
            command: parsed.cmd,
            args: parsed.args.join(" "),
          });
        }
      }
    } catch (error) {
      console.error("Command preparation failed", error);
      term.stylePrint("Command failed to load required assets. Please try again.");
    } finally {
      if (settings.promptAfter && exitStatus != 1 && parsed.cmd != "upgrade") {
        term.prompt();
        term.clearCurrentLine(true);
      }

      if (settings.manageBusy) {
        term.busy = false;
      }

      term.scrollToBottom();
    }

    return exitStatus;
  };

  term.resizeListener = () => {
    term._initialized = false;
    term.init(term.user, true);
    if (typeof preloadASCIIArt === "function") {
      window.scheduleIdleTask(() => preloadASCIIArt(), 1500);
    }
    term.runDeepLink();
    for (c of term.history) {
      term.prompt("\r\n", ` ${c}\r\n`);
      term.command(c);
    }
    term.prompt();
    term.scrollToBottom();
    term._initialized = true;
  };

  term.init = (user = "guest", preserveHistory = false) => {
    window.fitAddon.fit();
    term.reset();
    term.printLogoType();
    if (term.VERSION == 3) {
      term.stylePrint(
        `\n${colorText("New version of Root Ventures detected.", "user")}`
      );
      term.stylePrint(
        `Please upgrade your terminal with ${colorText("upgrade", "command")}.`
      );
    } else {
      term.stylePrint(
        "Welcome to the Root Ventures terminal. Seeding bold engineers!"
      );
      term.stylePrint(
        `Type ${colorText(
          "help",
          "command"
        )} to get started. Or type ${colorText(
          "exit",
          "command"
        )} for web version.`,
        false
      );
    }
    if (Object.keys(jobs).length > 0) {
      term.stylePrint(
        `\r\nOpen jobs detected. Type ${colorText(
          "jobs",
          "command"
        )} for more info.`,
        false
      );
    }

    term.user = user;
    if (!preserveHistory) {
      term.history = [];
    }
    term.focus();
  };

  term.runDeepLink = () => {
    if (term.deepLink != "") {
      term.executeCommandLine(term.deepLink, {
        addToHistory: false,
        promptAfter: false,
        showLeadingNewline: false,
        trackAnalytics: false,
      }).catch((error) => {
        console.error("Deep link failed", error);
      });
    }
  };

  // Interactive input collection
  term.collectInput = (prompt, isOptional = false) => {
    return new Promise((resolve) => {
      term.locked = true;
      term.write(`\r\n${prompt}${isOptional ? ' (optional)' : ''}: `);
      let inputBuffer = '';

      const inputHandler = term.onData((e) => {
        switch (e) {
          case '\r': // Enter
            term.write('\r\n');
            inputHandler.dispose(); // Properly remove handler
            term.locked = false;
            resolve(inputBuffer.trim());
            break;
          case '\u0003': // Ctrl+C
            term.write('^C\r\n');
            inputHandler.dispose(); // Properly remove handler
            term.locked = false;
            resolve(null);
            break;
          case '\u007F': // Backspace
          case '\u0008': // Ctrl+H
            if (inputBuffer.length > 0) {
              inputBuffer = inputBuffer.slice(0, -1);
              term.write('\b \b');
            }
            break;
          case '\u0015': // Ctrl+U (clear line)
            while (inputBuffer.length > 0) {
              term.write('\b \b');
              inputBuffer = inputBuffer.slice(0, -1);
            }
            break;
          case '\033[A': // Up arrow
          case '\033[B': // Down arrow
          case '\033[C': // Right arrow
          case '\033[D': // Left arrow
            // Ignore arrow keys for now (simple input)
            break;
          default:
            // Only accept printable characters
            if (e.length === 1 && e.charCodeAt(0) >= 32 && e.charCodeAt(0) < 127) {
              inputBuffer += e;
              term.write(e);
            }
            break;
        }
      });
    });
  };
};

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
// TODO: This doesn't work well at detecting newline
function _wordWrap(str, maxWidth) {
  var newLineStr = "\r\n";
  done = false;
  res = "";
  while (str.length > maxWidth) {
    found = false;
    // Inserts new line at first whitespace of the line
    for (i = maxWidth - 1; i >= 0; i--) {
      if (_testWhite(str.charAt(i))) {
        res = res + [str.slice(0, i), newLineStr].join("");
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    // Inserts new line at maxWidth position, the word is too long to wrap
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join("");
      str = str.slice(maxWidth);
    }
  }
  return res + str;
}

function _testWhite(x) {
  var white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
}
