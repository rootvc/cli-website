const commands = {
  help: function() {
    const maxCmdLength = 25;
    Object.entries(help).forEach(function(kv) {
      var cmd = kv[0];
      const rightPad = maxCmdLength - cmd.length;
      cmd = cmd.concat(" ".repeat(rightPad));
      term.stylePrint(cmd + kv[1]);
    });
  },

  echo: function(args) {
    const message = args.join(" ");
    term.stylePrint(message);
  },

  pwd: function() {
    term.stylePrint("/");
  },

  ls: function() {
    term.stylePrint(colorText("id_rsa     README.md", "files"));
  },

  cd: function(args) {
    const dir = args[0];
    if (dir == "/" || dir == ".") {
    } else {
      term.stylePrint(`No such directory: ${dir}`);
    }
  },

  cat: function(args) {
    const filename = args[0];
    const readme = "_aut inveniam viam aut faciam_";

    if (filename == "readme.md") {
      term.stylePrint(readme);
    } else if (filename == "id_rsa") {
      term.stylePrint("Nice try.");
    }
    else {
      term.stylePrint(`No such file: ${filename}`);
    }
  },

  tail: function(args) {
    commands["cat"](args);
  },

  emacs: function() {
    term.stylePrint("emacs not installed. try: vi");
  },

  vi: function() {
    term.stylePrint("vi not installed. try: emacs");
  },

  vim: function() {
    term.stylePrint("vim not installed. try: emacs");
  },

  pico: function() {
    term.stylePrint("pico not installed. try: vi or emacs");
  },

  nano: function() {
    term.stylePrint("nano not installed. try: vi or emacs");
  },

  pine: function() {
    openURL("mailto:team@root.vc");
  },

  curl: function() {
    term.stylePrint("Sorry, CORS isn't going to let you do that from the browser.");
  },

  ftp: function() {
    command("curl");
  },

  ssh: function() {
    command("curl");
  },

  sftp: function() {
    command("curl");
  },

  rm: function() {
    term.stylePrint("I can't let you do that, Dave.");
  },

  fdisk: function() {
    command("rm");
  },

  chown: function() {
    term.stylePrint("You do not have permission to chown.");
  },

  chmod: function() {
    term.stylePrint("You do not have permission to chmod.");
  },

  mv: function(args) {
    const src = args[0];
    const _dest = args[1];

    if (src == "id_rsa") {
      term.stylePrint("You do not have permission to copy file id_rsa.");
    } else if (src == "readme.md") {
      term.stylePrint("You do not have permission to copy file README.md.");
    } else {
      term.stylePrint(`File not found: ${src}.`);
    }
  },

  cp: function(args) {
    const src = args[0];
    const _dest = args[1];

    if (src == "id_rsa") {
      term.stylePrint("You do not have permission to copy file id_rsa.");
    } else if (src == "readme.md") {
      term.stylePrint("You do not have permission to copy file README.md.");
    } else {
      term.stylePrint(`File not found: ${src}.`);
    }
  },

  touch: function() {
    term.stylePrint("You can't touch this.");
  },

  sudo: function() {
    term.stylePrint("User not in the sudoers file. This incident will be reported.");
  },

  su: function() {
    command("sudo");
  },

  exit: function() {
    command("test");
  },

  quit: function() {
    command("exit");
  },

  stop: function() {
    term.stylePrint("Can't stop, won't stop.");
  },

  whoami: function() {
    term.stylePrint("guest");
  },

  passwd: function() {
    term.stylePrint("Wow. Maybe don't enter your password into a sketchy web-based command prompt?");
  },

  other: function() {
    term.stylePrint("Yeah, I didn't literally mean other. I mean try some Linux commands.");
  },

  whois: function(args) {
    const name = args[0];
    const people = Object.keys(team);

    if (!name) {
      term.stylePrint("Missing argument. Try:\r\n");
      term.stylePrint("whois root");
      for (p of people) {
        term.stylePrint(`whois ${p}`);
      }
    } else if (name == "root") {
      const description = "Root Ventures is a hard tech seed fund based in San Francisco. We are engineers leading the first venture rounds for technical founding teams solving hard problem.";
      term.printArt("rootvc-square");
      term.stylePrint(description);
    } else if (Object.keys(team).includes(name)) {
      const person = team[name];
      term.printArt(name);
      term.stylePrint(`\r\n${person["name"]}, ${person["title"]} - ${name}@root.vc`);
      term.stylePrint(`${person["linkedin"]}\r\n`);
      term.stylePrint(person["description"]);
    } else {
      term.stylePrint(`User ${name || ''} not found. Try:\r\n`);
      term.stylePrint("whois root");
      for (p of people) {
        term.stylePrint(`whois ${p}`);
      }
    }
  },

  tldr: function(args) {
    const name = (args[0] || "");
    if (!name) {
      const companies = Object.keys(portfolio);
      term.stylePrint("Missing argument. Try:\r\n");
      for (c of companies) {
        term.stylePrint(`tldr ${c}`);
      }
    } else if (!portfolio[name]) {
      term.stylePrint(`Portfolio company ${name} not found. Should we talk to them? Email us: team@root.vc`);
    } else {
      const company = portfolio[name];
      if (term.cols >= 60) {
        term.printArt(name)
      }
      term.stylePrint(company["name"]);
      term.stylePrint(company["url"]);
      if (company["memo"]) {
        term.stylePrint(`Investment Memo: ${company["memo"]}`);
      }
      term.stylePrint("");
      term.stylePrint(company["description"]);
    }
  },

  man: function(args) {
    command(`tldr ${args}`);
  },

  woman: function(args) {
    command(`tldr ${args}`);
  },

  git: function() {
    command("github");
  },

  test: function() {
    openURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  },

  email: function() {
    command("pine");
  },

  github: function() {
    displayURL("https://github.com/rootvc");
  },

  twitter: function() {
    displayURL("https://twitter.com/machinepix");
  },

  instagram: function() {
    displayURL("https://www.instagram.com/machinepix/");
  }
}
