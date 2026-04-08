// commands.js — Terminal command definitions for the Root Ventures interactive CLI.
//
// Each key in `commands` maps to a function that runs when the user types that
// command. Commands receive `args` as an array of whitespace-split tokens
// (everything after the command name). They communicate with the user via the
// global `term` object (see terminal-ext.js for its API).
//
// To add a new command, add an entry to `commands` below.
// To add a simple redirect (alias), add an entry to `_aliases` at the bottom.

// Blurb displayed by `whois root`.
const whoisRoot =
  "Root Ventures is a San Francisco-based deep tech seed fund. As engineers ourselves, we specialize in leading initial funding for founders tackling new technical opportunities. Our initial investments typically range from $3-5M. With a selective few new deals a year and 2/3 of our funds in reserve, we are committed to being a long-term partner. Try %whois% and one of avidan, kane, chrissy, lee, ben, zodi, or laelah to learn more about our team.";

// Set to 10 during development to speed up animated sequences (upgrade, etc.).
const timeUnit = 1000;

// Tracks whether the user has "killed" the fake crypto miner easter egg (pid 337).
let killed = false;

// Emits a series of styled strings that the RickRoll animation in rickroll.js
// interprets as frame pointers. Triggered by `cat id_rsa` or `test`.
function SpawnRickRollPointers() {
  function padNumber(num, length) {
    let str = num.toString();
    while (str.length < length) {
      str = "0" + str;
    }
    return str;
  }

  const colSize = term.cols >= 90 ? 39 : 24;

  for (let i = 0; i <= colSize; i++) {
    term.stylePrint(
      `${colorText(`vsabnBRXofjub${padNumber(i, 2)}`, "command")}`,
      false
    );
  }
}

const commands = {

  // ── Info & Discovery ────────────────────────────────────────────────────────

  // Lists all public commands from help.js, aligned to terminal width.
  help: function () {
    const maxCmdLength = Math.max(...Object.keys(help).map((x) => x.length));
    Object.entries(help).forEach(function (kv) {
      const cmd = kv[0];
      const desc = kv[1];
      if (term.cols >= 80) {
        const rightPad = maxCmdLength - cmd.length + 2;
        const sep = " ".repeat(rightPad);
        term.stylePrint(`${cmd}${sep}${desc}`);
      } else {
        if (cmd != "help") {
          // skip second leading newline
          term.writeln("");
        }
        term.stylePrint(cmd);
        term.stylePrint(desc);
      }
    });
  },

  // Displays bio and ASCII art portrait for a team member, or the firm blurb.
  whois: function (args) {
    const name = args[0];
    const people = Object.keys(team);

    if (!name) {
      term.stylePrint(
        "%whois%: Learn about the firm, or a partner - usage:\r\n"
      );
      term.stylePrint("%whois% root");
      for (const p of people) {
        term.stylePrint(`%whois% ${p}`);
      }
    } else if (name == "root") {
      const description = whoisRoot;
      term.printArt("rootvc-square");
      term.stylePrint(description);
    } else if (Object.keys(team).includes(name)) {
      const person = team[name];
      term.printArt(name);
      term.stylePrint(
        `\r\n${person["name"]}, ${person["title"]} - ${name}@root.vc`
      );
      term.stylePrint(`${person["linkedin"]}\r\n`);
      term.stylePrint(person["description"]);
    } else {
      term.stylePrint(`User ${name || ""} not found. Try:\r\n`);
      term.stylePrint("%whois% root");
      for (const p of people) {
        term.stylePrint(`%whois% ${p}`);
      }
    }
  },

  // Displays info about a portfolio company, or lists all companies.
  // Each entry is sourced from portfolio.js; companies with a `demo` field
  // also get a runnable command registered at the bottom of this file.
  tldr: function (args) {
    const name = args[0] || "";
    if (!name) {
      const companies = Object.keys(portfolio);
      term.stylePrint("%tldr%: Learn about a portfolio company - usage:\r\n");
      for (const c of companies.sort()) {
        const data = portfolio[c];
        const tabs = c.length > 10 ? "\t" : "\t\t";
        const sep = term.cols >= 76 ? tabs : "\r\n";
        term.stylePrint(`%tldr% ${c}${sep}${data["url"]}`);
        if (term.cols < 76 && c != companies[companies.length - 1]) {
          term.writeln("");
        }
      }
    } else if (!portfolio[name]) {
      term.stylePrint(
        `Portfolio company ${name} not found. Should we talk to them? Email us: hello@root.vc`
      );
    } else {
      const company = portfolio[name];
      term.cols >= 60 ? term.printArt(name) : term.writeln("");
      term.stylePrint(company["name"]);
      term.stylePrint(company["url"]);
      if (company["memo"]) {
        term.stylePrint(`Investment Memo: ${company["memo"]}`);
      }
      term.stylePrint("");
      term.stylePrint(company["description"]);
      if (company["demo"]) {
        term.stylePrint(`Try it with command: %${name}%`);
      }
    }
  },

  // ── Social & Contact ────────────────────────────────────────────────────────

  git: function () {
    term.displayURL("https://github.com/rootvc/cli-website");
  },

  agm: function () {
    term.openURL("http://annualmeeting.root.vc");
  },

  github: function () {
    term.displayURL("https://github.com/rootvc");
  },

  twitter: function () {
    term.displayURL("https://twitter.com/rootvc");
    term.displayURL("https://twitter.com/machinepix");
  },

  instagram: function () {
    term.displayURL("https://instagram.com/machinepix/");
  },

  pine: function () {
    term.openURL("mailto:hello@root.vc");
  },

  // ── File System ─────────────────────────────────────────────────────────────
  // The virtual file system is defined in fs.js. Files are stored as hidden
  // DOM elements and fetched from GitHub on first load.

  other: function () {
    term.stylePrint(
      "Yeah, I didn't literally mean %other%. I mean try some Linux commands"
    );
  },

  echo: function (args) {
    const message = args.join(" ");
    term.stylePrint(message);
  },

  say: function (args) {
    const message = args.join(" ");
    term.stylePrint(`(Robot voice): ${message}`);
  },

  // Expands ~ to /home/<user> to mimic a real shell.
  pwd: function () {
    term.stylePrint("/" + term.cwd.replaceAll("~", `home/${term.user}`));
  },

  ls: function () {
    term.stylePrint(_filesHere().join("   "));
  },

  // Simulates a minimal Unix directory tree:
  //   /
  //   ├── bin/   (contains zsh)
  //   └── home/  (contains guest, root, and each team member)
  //       └── ~/  (the current user's home)
  //
  // Team member home dirs are always permission-denied to keep things fun.
  // Paths are matched by regex before the switch so we don't have to hardcode
  // team member names here — they're derived from team.js at runtime.
  cd: function (args) {
    let dir = args[0] || "~";
    if (dir !== "/") {
      dir = dir.replace(/\/$/, ""); // strip trailing slash
    }

    const teamMembers = Object.keys(team);

    // ../home/<member> — relative path from ~ or /bin
    const relativeHomeMatch = dir.match(/^\.\.\/home\/(.+)$/);
    if (relativeHomeMatch) {
      if (term.cwd === "~" || term.cwd === "bin") {
        term.command(`cd ${relativeHomeMatch[1]}`);
      } else {
        term.stylePrint(`No such directory: ${dir}`);
      }
      return;
    }

    // /home/<member> — absolute path to a home dir
    const absoluteHomeMatch = dir.match(/^\/home\/(.+)$/);
    if (absoluteHomeMatch) {
      const member = absoluteHomeMatch[1];
      if (teamMembers.includes(member)) {
        term.stylePrint(`You do not have permission to access this directory`);
      } else {
        term.stylePrint(`No such directory: ${dir}`);
      }
      return;
    }

    // Bare team member name (e.g. `cd avidan`)
    if (teamMembers.includes(dir)) {
      term.stylePrint(`You do not have permission to access this directory`);
      return;
    }

    switch (dir) {
      case "~":
        term.cwd = "~";
        break;
      case "..":
        if (term.cwd === "~") {
          term.command("cd /home");
        } else if (term.cwd === "home" || term.cwd === "bin") {
          term.command("cd /");
        }
        break;
      // Any deeply nested upward traversal just lands at root.
      case "../..":
      case "../../..":
      case "../../../..":
      case "/":
        term.cwd = "/";
        break;
      case "home":
        // `home` alone is only reachable from /
        if (term.cwd === "/") {
          term.command("cd /home");
        } else {
          term.stylePrint(`You do not have permission to access this directory`);
        }
        break;
      case "/home":
        term.cwd = "home";
        break;
      // guest and root can only cd to their own home
      case "guest":
      case "root":
        if (term.cwd === "home") {
          if (term.user === dir) {
            term.command("cd ~");
          } else {
            term.stylePrint(`You do not have permission to access this directory`);
          }
        } else {
          term.stylePrint(`No such directory: ${dir}`);
        }
        break;
      case "/bin":
        term.cwd = "bin";
        break;
      case "bin":
        if (term.cwd === "/") {
          term.cwd = "bin";
        } else {
          term.stylePrint(`No such directory: ${dir}`);
        }
        break;
      case ".":
        break; // no-op
      default:
        term.stylePrint(`No such directory: ${dir}`);
        break;
    }
  },

  // Reinitializes the terminal under the current user (simulates a new shell).
  zsh: function () {
    term.init(term.user);
  },

  // Reading id_rsa triggers the RickRoll easter egg.
  cat: function (args) {
    const filename = args[0];

    if (_filesHere().includes(filename)) {
      term.writeln(getFileContents(filename));
    } else {
      term.stylePrint(`No such file: ${filename}`);
    }
    if (filename == "id_rsa") {
      SpawnRickRollPointers();
    }
  },

  // Grepping id_rsa redirects to an appropriate reaction GIF instead.
  grep: function (args) {
    const q = args[0];
    const filename = args[1];

    if (filename == "id_rsa") {
      term.openURL("https://i.imgur.com/Q2Unw.gif");
    }

    if (!q || !filename) {
      term.stylePrint("usage: %grep% [pattern] [filename]");
      return;
    }

    if (_filesHere().includes(filename)) {
      let file = getFileContents(filename);
      const matches = file.matchAll(q);
      for (const match of matches) {
        file = file.replaceAll(match[0], colorText(match[0], "files"));
      }
      term.writeln(file);
    } else {
      term.stylePrint(`No such file or directory: ${filename}`);
    }
  },

  // `open test.htm` is an easter egg; all other .htm files open in-page.
  open: function (args) {
    if (!args.length) {
      term.stylePrint("%open%: open a file - usage:\r\n");
      term.stylePrint("%open% test.htm");
    } else if (
      args[0].split(".")[0] == "test" &&
      args[0].split(".")[1] == "htm"
    ) {
      term.openURL("https://i.imgur.com/Q2Unw.gif");
    } else if (args[0].split(".")[1] == "htm") {
      term.openURL(`./${args[0]}`, false);
    } else if (args.join(" ") == "the pod bay doors") {
      term.stylePrint("I'm sorry Dave, I'm afraid I can't do that.");
    } else {
      term.command(`cat ${args.join(" ")}`);
    }
  },

  find: function (args) {
    const file = args[0];
    if (Object.keys(_FILES).includes(file)) {
      term.stylePrint(_FULL_PATHS[file]);
    } else {
      term.stylePrint(`%find%: ${file}: No such file or directory`);
    }
  },

  // ── Users & Permissions ─────────────────────────────────────────────────────
  // These mimic standard Unix user commands. guest and root are the only two
  // switchable users; team member home dirs are always permission-denied.

  // Reports login info. Team member data comes from team.js.
  finger: function (args) {
    const user = args[0];
    if (user === "guest") {
      term.stylePrint("Login: guest            Name: Guest");
      term.stylePrint("Directory: /home/guest  Shell: /bin/zsh");
    } else if (user === "root") {
      term.stylePrint("Login: root             Name: That's Us!");
      term.stylePrint("Directory: /home/root   Shell: /bin/zsh");
    } else if (team[user]) {
      term.stylePrint(`Login: ${user}   Name: ${team[user]["name"]}`);
      term.stylePrint(`Directory: /home/${user}   Shell: /bin/zsh`);
    } else {
      term.stylePrint(
        user ? `%finger%: ${user}: no such user` : "usage: %finger% [user]"
      );
    }
  },

  // Group memberships live in each person's entry in team.js.
  // guest and root have their own special groups defined inline here.
  groups: function (args) {
    const user = args[0];
    const specialGroups = {
      guest: "guest lps founders engineers investors",
      root: "wheel investors engineers deep tech firms",
    };
    if (specialGroups[user] !== undefined) {
      term.stylePrint(specialGroups[user]);
    } else if (team[user]) {
      term.stylePrint(team[user].groups);
    } else {
      term.stylePrint(
        user ? `%groups%: ${user}: no such user` : "usage: %groups% [user]"
      );
    }
  },

  whoami: function () {
    term.stylePrint(term.user);
  },

  passwd: function () {
    term.stylePrint(
      "Wow. Maybe don't enter your password into a sketchy web-based term.command prompt?"
    );
  },

  // Only root can sudo; otherwise logs an incident (just like real life).
  sudo: function (args) {
    if (term.user == "root") {
      term.command(args.join(" "));
    } else {
      term.stylePrint(
        `${colorText(
          term.user,
          "user"
        )} is not in the sudoers file. This incident will be reported`
      );
    }
  },

  // Switch between the two valid users: guest and root.
  su: function (args) {
    const user = args[0] || "root";

    if (user == "root" || user == "guest") {
      term.user = user;
      term.command("cd ~");
    } else {
      term.stylePrint("su: Sorry");
    }
  },

  chown: function () {
    term.stylePrint("You do not have permission to %chown%");
  },

  chmod: function () {
    term.stylePrint("You do not have permission to %chmod%");
  },

  mv: function (args) {
    const src = args[0];

    if (_filesHere().includes(src)) {
      term.stylePrint(`You do not have permission to move file ${src}`);
    } else {
      term.stylePrint(`%mv%: ${src}: No such file or directory`);
    }
  },

  cp: function (args) {
    const src = args[0];

    if (_filesHere().includes(src)) {
      term.stylePrint(`You do not have permission to copy file ${src}`);
    } else {
      term.stylePrint(`%cp%: ${src}: No such file or directory`);
    }
  },

  touch: function () {
    term.stylePrint("You can't %touch% this");
  },

  // ── Process & System ────────────────────────────────────────────────────────

  // Shows a fake process list. PID 337 is a fake crypto miner that stays
  // visible until the user runs `kill 337`.
  ps: function () {
    term.stylePrint("PID TTY       TIME CMD");
    term.stylePrint("424 ttys00 0:00.33 %-zsh%");
    term.stylePrint("158 ttys01 0:09.70 %/bin/npm start%");
    term.stylePrint("767 ttys02 0:00.02 %/bin/sh%");
    if (!killed) {
      term.stylePrint("337 ttys03 0:13.37 %/bin/cgminer -o pwn.d%");
    }
  },

  // `kill 337` disables the fake crypto miner shown in `ps`.
  kill: function (args) {
    if (args && args.slice(-1) == 337) {
      killed = true;
      term.stylePrint("Root Ventures crypto miner disabled.");
    } else {
      term.stylePrint("You can't kill me!");
    }
  },

  locate: function () {
    term.stylePrint("Root Ventures");
    term.stylePrint("2670 Harrison St");
    term.stylePrint("San Francisco, CA 94110");
  },

  history: function () {
    term.history.forEach((element, index) => {
      term.stylePrint(`${1000 + index}  ${element}`);
    });
  },

  uname: function (args) {
    switch (args[0]) {
      case "-a":
        term.stylePrint(
          "RootPC rootpc 0.0.1 RootPC Kernel Version 0.0.1 root:xnu-31415.926.5~3/RELEASE_X86_64 x86_64"
        );
        break;
      case "-mrs":
        term.stylePrint("RootPC 0.0.1 x86_64");
        break;
      default:
        term.stylePrint("RootPC");
    }
  },

  ping: function () {
    term.stylePrint("pong");
  },

  // Opens the GeoCities-style welcome page (welcome.htm).
  exit: function () {
    term.command("open welcome.htm");
  },

  // Reinitializes the terminal, clearing history and resetting the prompt.
  clear: function () {
    term.init();
  },

  // ── Easter Eggs & Jokes ─────────────────────────────────────────────────────

  gzip: function () {
    term.stylePrint(
      "What are you going to do with a zip file on a fake terminal, seriously?"
    );
  },

  free: function () {
    term.stylePrint("Honestly, our memory isn't what it used to be.");
  },

  rm: function () {
    term.stylePrint("I'm sorry Dave, I'm afraid I can't do that.");
  },

  mkdir: function () {
    term.stylePrint("Come on, don't mess with our immaculate file system.");
  },

  alias: function () {
    term.stylePrint("Just call me HAL.");
  },

  df: function () {
    term.stylePrint("Nice try. Just get a Dropbox.");
  },

  // Editor wars — each editor points you to a different one.
  emacs: function () {
    term.stylePrint("%emacs% not installed. try: %vi%");
  },

  vim: function () {
    term.stylePrint("%vim% not installed. try: %emacs%");
  },

  vi: function () {
    term.stylePrint("%vi% not installed. try: %emacs%");
  },

  pico: function () {
    term.stylePrint("%pico% not installed. try: %vi% or %emacs%");
  },

  nano: function () {
    term.stylePrint("%nano% not installed. try: %vi% or %emacs%");
  },

  // Cross-origin policy joke — all network commands hit this wall.
  curl: function (args) {
    term.stylePrint(
      `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource ${args[0]}. Use a real terminal.`
    );
  },

  // scp gets a more redacted treatment than curl.
  scp: function (args) {
    term.stylePrint(
      `████████████ Request Blocked: The ███████████ Policy disallows reading the ██████ resource ${args[0]}.`
    );
  },

  zed: function () {
    term.stylePrint("Coming soon! ;)");
  },

  eval: function (args) {
    term.stylePrint(
      "please instead build a webstore with macros. in the meantime, the result is: " +
        eval(args.join(" "))
    );
  },

  test: function () {
    SpawnRickRollPointers();
  },

  // ── Upgrade ─────────────────────────────────────────────────────────────────

  // Animated sequence that "upgrades" the terminal to fund version 4.0.
  // Locks the terminal during the animation to block user input.
  upgrade: async function (args) {
    term.VERSION = 4;
    term.init();
    term.locked = true;
    term.write(
      `\r\n${colorText(
        "==>",
        "hyperlink"
      )} Downloading https://ghcr.io/v2/homebrew/core/rootvc/manifests/4.0.0`
    );
    await term.progressBar(4 * timeUnit);
    term.write(
      `\r\n${colorText(
        "==>",
        "hyperlink"
      )} Downloading https://ghcr.io/v2/homebrew/core/go/blobs/sha256:51869c798355307b59992918e9a595c53072d7a29458dbe5b8d105b63d3dd1c0`
    );
    await term.progressBar(2 * timeUnit);
    term.write(
      `\r\n${colorText(
        "==>",
        "hyperlink"
      )} Downloading from https://pkg-containers.githubusercontent.com/ghcr1/blobs/sha256:51869c798355307b59992918e9a595c53072d7a29458dbe5b8d105b6`
    );
    await term.progressBar(1 * timeUnit);
    term.write(
      `\r\n${colorText("==>", "hyperlink")} npm install left-pad@latest`
    );
    await term.progressBar(0.5 * timeUnit);

    await term.delayStylePrint("\r\n", 1 * timeUnit);
    await term.dottedPrint("Calculating new fund size", 3);
    await term.delayPrint(
      `Updated fund size:          ${colorText("$190M", "prompt")}\r\n`,
      1 * timeUnit
    );
    await term.delayPrint(
      `Updated typical check size: ${colorText("up to $5M", "prompt")}\r\n`,
      1 * timeUnit
    );
    await term.delayPrint(
      `Found mission:              ${colorText(
        "Seeding bold engineers.",
        "user"
      )}\r\n`,
      1 * timeUnit
    );
    await term.delayPrint(
      `Thesis (no update):         ${colorText(
        "Investing at the earliest stages of technical founders taking engineering risk.",
        "user"
      )}\r\n`,
      1 * timeUnit
    );

    await term.delayStylePrint(
      `\r\n${colorText(
        "You are now running Root Ventures version 4.0.",
        "hyperlink"
      )}\r\n`,
      1 * timeUnit
    );
    await term.delayStylePrint(
      `To learn more about this release, RTFM at: ${colorText(
        "https://bit.ly/rvfund4",
        "hyperlink"
      )}\r\n`,
      0.5 * timeUnit
    );
    await term.delayStylePrint(
      `or remote into our coffee grinder at: ${colorText(
        "https://rootventures.coffee",
        "hyperlink"
      )}\r\n`,
      0.5 * timeUnit
    );
    await term.delayPrint(
      "Note that VERSION 4.0 is an unstable build of the terminal.\r\n",
      1 * timeUnit
    );
    await term.delayPrint("Please report any bugs you find.\r\n", 1 * timeUnit);

    term.stylePrint(
      `\r\nType ${colorText(
        "help",
        "command"
      )} to get started. Or type ${colorText(
        "exit",
        "command"
      )} for web version.`,
      false
    );

    term.prompt();
    term.clearCurrentLine();
    term.locked = false;
  },

  // ── Jobs & Recruiting ────────────────────────────────────────────────────────
  // Job data lives in jobs.js. Each job is an array of lines where index 0
  // is the title and the rest is the description shown by `fg`.

  jobs: function () {
    const jobIds = Object.keys(jobs);
    if (jobIds.length === 0) {
      term.stylePrint(`No jobs currently found. Check back later.`);
    } else {
      term.stylePrint(`Open positions:\r\n`);
      jobIds.forEach((id) => {
        const jobTitle = jobs[id][0];
        term.stylePrint(`[${id}] ${jobTitle}`);
      });
      term.stylePrint(`\r\nUse %fg% [job_id] to view details, or %apply% [job_id] to apply.`);
    }
  },

  bg: function (args) {
    term.stylePrint(
      `Sorry. If you want to background one of these jobs, you'll need to help us fill it. Try %fg% ${args} instead.`
    );
  },

  // Prints all lines of a job listing.
  fg: function (args) {
    const job = jobs[args];

    if (job) {
      job.map((line) => term.stylePrint(line));
      term.stylePrint(`\r\n%apply% ${args} to apply!`);
    } else {
      term.stylePrint(`job id ${args} not found.`);
    }
  },

  // Multi-step async application form. The terminal is locked during collection
  // so normal keypress handling is suspended. Returns 1 to tell the main input
  // loop not to re-render the prompt — the async IIFE does that itself when done.
  //
  // collectInput() resolves to: a string on submit, "" if skipped (optional
  // fields), or null on Ctrl+C. Null means the user cancelled.
  apply: function (args) {
    if (args == 1 || (args.length > 0 && args[0] == 1)) {
      term.locked = true;

      (async () => {
        // Shared cancellation handler — restores the terminal to a usable state.
        const cancel = () => {
          term.stylePrint("\r\nApplication cancelled.");
          term.prompt();
          term.clearCurrentLine(true);
          term.locked = false;
        };

        term.stylePrint(
          "Great! Let's get your application started. (Press Ctrl+C to cancel at any time)\r\n"
        );

        const name = await term.collectInput("What's your name?");
        if (!name) { cancel(); return; }

        const email = await term.collectInput("Email address");
        if (!email) { cancel(); return; }

        const linkedin = await term.collectInput("LinkedIn profile URL", true);
        if (linkedin === null) { cancel(); return; }

        const github = await term.collectInput("GitHub username", true);
        if (github === null) { cancel(); return; }

        const notes = await term.collectInput(
          "Why Root? What makes you a great fit?",
          true
        );
        if (notes === null) { cancel(); return; }

        term.stylePrint("\r\nSubmitting application...");

        try {
          const response = await fetch("/.netlify/functions/submit-application", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              linkedin: linkedin || undefined,
              github: github || undefined,
              notes: notes || undefined,
              position: "Venture Capital Associate",
            }),
          });

          const result = await response.json();

          if (response.ok) {
            term.stylePrint(
              `\r\n${colorText("✓", "prompt")} Application submitted successfully!`
            );
            term.stylePrint(
              "\r\nThanks for applying! We'll review your application and get back to you soon."
            );
            term.stylePrint(
              `\r\nIn the meantime, check out our portfolio with ${colorText(
                "tldr",
                "command"
              )} or learn more about the team with ${colorText(
                "whois",
                "command"
              )}.`
            );
          } else {
            throw new Error(result.error || "Submission failed");
          }
        } catch (error) {
          term.stylePrint(
            `\r\n${colorText("✗", "user")} Error submitting application: ${error.message}`
          );
          term.stylePrint(
            "\r\nPlease try again or email us directly at hello@root.vc"
          );
        }

        term.prompt();
        term.clearCurrentLine(true);
        term.locked = false;
      })();

      // Return 1 synchronously so terminal.js skips its automatic prompt render.
      return 1;
    } else if (!args || args == "" || args.length === 0) {
      term.stylePrint(
        "Please provide a job id. Use %jobs% to list all current jobs."
      );
    } else {
      term.stylePrint(
        `Job id ${args[0]} not found. Use %jobs% to list all current jobs.`
      );
    }
  },
};

// ── Portfolio Demo Commands ────────────────────────────────────────────────────
// For any portfolio company that has a `demo` URL, register a command with the
// company's key that opens the demo. E.g. `meroxa` opens meroxa's demo URL.
for (const [key, val] of Object.entries(portfolio)) {
  if (val["demo"]) {
    commands[key] = () => term.displayURL(val["demo"]);
  }
}

// Returns the list of files visible in the current directory.
// README.md is hidden from guest — root can see everything.
function _filesHere() {
  return _DIRS[term.cwd].filter((e) => e != "README.md" || term.user == "root");
}

// ── Aliases ───────────────────────────────────────────────────────────────────
// Simple one-to-one redirects. Each alias forwards its args to the target
// command. Chains are fine — ge → great_expectations → superconductive.
const _aliases = {
  // Standard file viewing aliases
  tail: "cat", less: "cat", head: "cat", more: "cat",
  // Network commands all hit the same CORS wall
  ftp: "curl", ssh: "curl", sftp: "curl",
  // man/woman both show the tldr for a portfolio company
  man: "tldr", woman: "tldr",
  // Session control
  quit: "exit", stop: "exit",
  // Process management
  killall: "kill",
  top: "ps",
  fdisk: "rm",
  // Contact shortcuts
  email: "pine",
  insta: "instagram",
  // Portfolio easter egg chains
  ge: "great_expectations",
  great_expectations: "superconductive",
  privacy: "privacy_dynamics",
};
for (const [alias, target] of Object.entries(_aliases)) {
  commands[alias] = (args) => term.command([target, ...args].join(" ").trim());
}
