// terminal-ext.js — Extends an xterm.js Terminal instance with all the custom
// behavior needed to run the Root Ventures CLI.
//
// Usage: call extend(term) once after creating the Terminal, before calling
// runRootTerminal(). This monkey-patches the term object in place rather than
// subclassing, which keeps it compatible with xterm addons.
//
// TODO: make this a proper xterm addon

const extend = (term) => {

  // ── State ──────────────────────────────────────────────────────────────────

  term.VERSION = term.VERSION || 3;  // bumped to 4 by `upgrade`
  term.currentLine = "";             // text the user has typed so far
  term.user = "guest";
  term.host = "rootpc";
  term.cwd = "~";
  term.sep = ":";
  term._promptChar = "$";
  term.history = [];
  term.historyCursor = -1;
  term.busy = false;

  // Tab completion state — reset on any non-tab keypress.
  term.tabIndex = 0;
  term.tabOptions = [];
  term.tabBase = "";

  // Cursor position relative to the start of the user's input (after the prompt).
  // Uses the raw xterm buffer position minus the prompt's character length.
  term.pos = () => term._core.buffer.x - term._promptRawText().length - 1;

  // Plain-text prompt string used for length calculations.
  term._promptRawText = () =>
    `${term.user}${term.sep}${term.host} ${term.cwd} $`;

  // Deep link: parse the URL hash as a command to run on load.
  // E.g. /#whois-avidan → runs `whois avidan` (hyphens become spaces).
  term.deepLink = window.location.hash.replace("#", "").split("-").join(" ");

  // ── Prompt ─────────────────────────────────────────────────────────────────

  // Returns the colorized prompt string for display.
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

  // Writes a newline + prompt (default) or a custom prefix/suffix pair.
  term.prompt = (prefix = "\r\n", suffix = " ") => {
    term.write(`${prefix}${term.promptText()}${suffix}`);
  };

  // Erases the current input line and redraws the prompt, optionally resetting
  // the history cursor so the next Up arrow starts from the most recent entry.
  term.clearCurrentLine = (goToEndofHistory = false) => {
    term.write("\x1b[2K\r");
    term.prompt("", " ");
    term.currentLine = "";
    if (goToEndofHistory) {
      term.historyCursor = -1;
      term.scrollToBottom();
    }
  };

  // Replaces the current input with newLine, preserving cursor position if asked.
  term.setCurrentLine = (newLine, preserveCursor = false) => {
    // Capture position before clearCurrentLine() because the xterm buffer
    // cursor moves during the erase, making pos() unreliable immediately after.
    const oldPos = term.pos();
    const length = term.currentLine.length;
    term.clearCurrentLine();
    term.currentLine = newLine;
    term.write(newLine);
    if (preserveCursor) {
      term.write("\x1b[D".repeat(length - oldPos));
    }
  };

  // ── Output ─────────────────────────────────────────────────────────────────

  // Prints a line of text with three processing passes applied in order:
  //   1. URLs are detected and colorized as hyperlinks (disables wrapping for
  //      long URLs since wrapping mid-URL would break clickability).
  //   2. Long lines are word-wrapped to fit the terminal width (max 76 cols).
  //   3. %command% tokens are replaced with colorized command names.
  term.stylePrint = (text, wrap = true) => {
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,24}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urlMatches = text.matchAll(urlRegex);
    let allowWrapping = true;
    for (const match of urlMatches) {
      allowWrapping = match[0].length < 76; // don't wrap lines that contain long URLs
      text = text.replace(match[0], colorText(match[0], "hyperlink"));
    }

    if (allowWrapping && wrap) {
      text = _wordWrap(text, Math.min(term.cols, 76));
    }

    // Replace %commandName% tokens with styled command names.
    const cmds = Object.keys(commands);
    for (const cmd of cmds) {
      const cmdMatches = text.matchAll(`%${cmd}%`);
      for (const match of cmdMatches) {
        text = text.replace(match[0], colorText(cmd, "command"));
      }
    }

    term.writeln(text);
  };

  // Renders the preloaded ASCII art for id into the terminal.
  // Silently skipped on narrow terminals (< 40 cols).
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

  // Prints the Root Ventures ASCII logotype, or a plain-text fallback on
  // very narrow terminals.
  term.printLogoType = () => {
    term.writeln(term.cols >= 40 ? LOGO_TYPE : "[Root Ventures]\r\n");
  };

  // Opens a URL in a new tab (default) or navigates the current page.
  term.openURL = (url, newWindow = true) => {
    term.stylePrint(`Opening ${url}`);
    if (term._initialized) {
      if (newWindow) {
        window.open(url, "_blank");
      } else {
        window.location.href = url;
      }
    }
  };

  // Prints a URL as a styled hyperlink without opening it.
  term.displayURL = (url) => {
    term.stylePrint(colorText(url, "hyperlink"));
  };

  // ── Animation Helpers ──────────────────────────────────────────────────────

  term.timer = (ms) => new Promise((res) => setTimeout(res, ms));

  // Prints phrase followed by n dots at 1-second intervals.
  term.dottedPrint = async (phrase, n, newline = true) => {
    term.write(phrase);

    for (let i = 0; i < n; i++) {
      await term.delayPrint(".", 1000);
    }
    if (newline) {
      term.write("\r\n");
    }
  };

  // Renders an animated progress bar that fills over time t (ms).
  // Randomizes the fill speed to look more authentic.
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

  // ── Command Dispatch ───────────────────────────────────────────────────────

  // Parses and executes a command line string. Called both by the Enter handler
  // in terminal.js and internally by commands that redirect to other commands.
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

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  // Called on window resize. xterm clears its buffer on resize, so we
  // reinitialize the terminal and replay the entire command history to restore
  // the visible output, then re-render the prompt at the bottom.
  term.resizeListener = () => {
    term._initialized = false;
    term.init(term.user, true);
    if (typeof preloadASCIIArt === "function") {
      window.scheduleIdleTask(() => preloadASCIIArt(), 1500);
    }
    term.runDeepLink();
    for (const c of term.history) {
      term.prompt("\r\n", ` ${c}\r\n`);
      term.command(c);
    }
    term.prompt();
    term.scrollToBottom();
    term._initialized = true;
  };

  // Resets the terminal to its initial state. If VERSION < 4, shows an upgrade
  // prompt instead of the welcome message. Announces open jobs if any exist.
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

  // Runs the deep-link command parsed from the URL hash on page load.
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

  // ── Interactive Input ──────────────────────────────────────────────────────

  // Prompts the user for a single line of input, suspending the normal input
  // handler while waiting. Returns a Promise that resolves to:
  //   - A trimmed string if the user pressed Enter (may be "" for optional fields)
  //   - null if the user pressed Ctrl+C (cancelled)
  term.collectInput = (prompt, isOptional = false) => {
    return new Promise((resolve) => {
      term.locked = true;
      term.write(`\r\n${prompt}${isOptional ? ' (optional)' : ''}: `);
      let inputBuffer = '';

      const inputHandler = term.onData((e) => {
        switch (e) {
          case '\r': // Enter — submit
            term.write('\r\n');
            inputHandler.dispose();
            term.locked = false;
            resolve(inputBuffer.trim());
            break;
          case '\u0003': // Ctrl+C — cancel, resolves to null
            term.write('^C\r\n');
            inputHandler.dispose();
            term.locked = false;
            resolve(null);
            break;
          case '\u007F': // Backspace
          case '\u0008': // Ctrl+H
            if (inputBuffer.length > 0) {
              inputBuffer = inputBuffer.slice(0, -1);
              term.write('\b \b'); // erase character from display
            }
            break;
          case '\u0015': // Ctrl+U — clear entire input line
            while (inputBuffer.length > 0) {
              term.write('\b \b');
              inputBuffer = inputBuffer.slice(0, -1);
            }
            break;
          case '\033[A': // Up arrow
          case '\033[B': // Down arrow
          case '\033[C': // Right arrow
          case '\033[D': // Left arrow
            // Ignore — cursor movement not supported in collectInput
            break;
          default:
            // Only accept printable ASCII characters
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

// ── Helpers ──────────────────────────────────────────────────────────────────

// Wraps str at word boundaries to fit within maxWidth characters per line.
// Falls back to a hard break at maxWidth if no whitespace is found.
// TODO: This doesn't work well at detecting existing newlines in the input.
// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function _wordWrap(str, maxWidth) {
  const newLineStr = "\r\n";
  let res = "";
  while (str.length > maxWidth) {
    let found = false;
    // Scan backwards from maxWidth to find a whitespace break point.
    for (let i = maxWidth - 1; i >= 0; i--) {
      if (_testWhite(str.charAt(i))) {
        res = res + [str.slice(0, i), newLineStr].join("");
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    // No whitespace found — hard-break at maxWidth.
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join("");
      str = str.slice(maxWidth);
    }
  }
  return res + str;
}

function _testWhite(x) {
  const white = /^\s$/;
  return white.test(x.charAt(0));
}
