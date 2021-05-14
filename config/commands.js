const commands = {
  help: function() {
    const maxCmdLength = 25;
    Object.entries(help).forEach(function(kv) {
      var cmd = kv[0];
      const rightPad = maxCmdLength - cmd.length;
      cmd = cmd.concat(" ".repeat(rightPad));
      term.writeln(cmd + kv[1]);
    });
  },

  echo: function(args) {
    const message = args.join(" ");
    term.writeln(message);
  },

  pwd: function() {
    term.writeln("/");
  },

  ls: function() {
    term.writeln("id_rsa     README.md");
  },

  cd: function(args) {
    const dir = args[0];
    if (dir == "/" || dir == ".") {
    } else {
      term.writeln(`No such directory: ${dir}`);
    }
  },

  cat: function(args) {
    const filename = args[0];
    const readme = "# Nice work! You can check out this code at: https://github.com/rootvc/cli-website";

    if (filename == "readme.md") {
      term.writeln(readme);
    } else if (filename == "id_rsa") {
      term.writeln("Nice try.");
    }
    else {
      term.writeln(`No such file: ${filename}`);
    }
  },

  tail: function(args) {
    commands["cat"](args);
  },

  emacs: function() {
    term.writeln("emacs not installed. try: vi");
  },

  vi: function() {
    term.writeln("vi not installed. try: emacs");
  },

  vim: function() {
    term.writeln("vim not installed. try: emacs");
  },

  pico: function() {
    term.writeln("pico not installed. try: vi or emacs");
  },

  nano: function() {
    term.writeln("nano not installed. try: vi or emacs");
  },

  pine: function() {
    openURL("mailto:team@root.vc");
  },

  curl: function() {
    term.writeln("Sorry, CORS isn't going to let you do that from the browser.");
  },

  ftp: function() {
    command('curl');
  },

  ssh: function() {
    command('curl');
  },

  sftp: function() {
    command('curl');
  },

  rm: function() {
    term.writeln("I can't let you do that, Dave.");
  },

  fdisk: function() {
    command('rm');
  },

  chown: function() {
    term.writeln("You do not have permission to chown.");
  },

  chmod: function() {
    term.writeln("You do not have permission to chmod.");
  },

  mv: function(args) {
    const src = args[0];
    const _dest = args[1];

    if (src == "id_rsa") {
      term.writeln("You do not have permission to copy file id_rsa.");
    } else if (src == "readme.md") {
      term.writeln("You do not have permission to copy file README.md.");
    } else {
      term.writeln(`File not found: ${src}.`);
    }
  },

  cp: function(args) {
    const src = args[0];
    const _dest = args[1];

    if (src == "id_rsa") {
      term.writeln("You do not have permission to copy file id_rsa.");
    } else if (src == "readme.md") {
      term.writeln("You do not have permission to copy file README.md.");
    } else {
      term.writeln(`File not found: ${src}.`);
    }
  },

  touch: function() {
    term.writeln("You can't touch this.");
  },

  sudo: function() {
    term.writeln("User not in the sudoers file. This incident will be reported.");
  },

  su: function() {
    command('sudo');
  },

  exit: function() {
    openURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  },

  quit: function() {
    command('exit');
  },

  stop: function() {
    term.writeln("Can't stop, won't stop.");
  },

  whoami: function() {
    term.writeln("guest");
  },

  passwd: function() {
    term.write("Wow. Maybe don't enter your password into a sketchy web-based command prompt?\r\n");
  },

  whois: function(args) {
    const name = args[0];
    const people = Object.keys(team);

    if (!name) {
      term.writeln(`Missing argument. Try:\r\nwhois ${people.join("\r\nwhois ")}`);
      prompt(term);
    } else if (name == "root") {
      term.writeln("Root Ventures is a hard tech seed fund based in San Francisco. All of us are engineers dedicated to leading investments in technical founding teams.");
      prompt(term);
    } else if (Object.keys(team).includes(name)) {
      const person = team[name];
      const filename = `/images/${name}.png`;
      const callback = function(ascii) {
        term.writeln(ascii);
        term.writeln("");
        term.writeln(person["name"]);
        term.writeln("");
        term.writeln(person["description"]);
        term.writeln(person["linkedin"]);
        prompt(term);
      }
      drawAsciiThen(filename, 1.0, 0.5, callback);
    } else {
      term.writeln(`User ${name || ''} not found. Try:\r\nwhois ${people.join("\r\nwhois ")}`);
      prompt(term);
    }
  },

  tldr: function(args) {
    const name = (args[0] || "").trim(); // TODO: Should trim before processing
    if (!name) {
      const companies = Object.keys(portfolio);
      term.writeln(`Missing argument. Try:\r\ntldr ${companies.join("\r\ntldr ")}`);
      prompt(term);
    } else if (!portfolio[name]) {
      term.writeln(`Portfolio company ${name} not found. Should we talk to them? Email us: team@root.vc`);
      prompt(term);
    } else {
      const company = portfolio[name];
      const filename = `/images/${name}.png`;
      const callback = function(ascii) {
        term.writeln(ascii);
        term.writeln(company["name"]);
        term.writeln(company["url"]);
        term.writeln(company["description"]);
        if (company["memo"]) {
          term.writeln(`Investment Memo: ${company["memo"]}`);
        }
        prompt(term);
      }
      drawAsciiThen(filename, 0.5, 1.0, callback);
    }
  },

  man: function(args) {
    this.tldr(args);
  },

  woman: function(args) {
    this.tldr(args);
  },

  git: function() {
    openURL("https://github.com/rootvc");
  },

  test: function() {
    openURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  },

  email: function() {
    command('pine');
  },

  github: function() {
    openURL("https://github.com/rootvc");
  },

  twitter: function() {
    openURL("https://twitter.com/machinepix");
  },

  instagram: function() {
    openURL("https://www.instagram.com/machinepix/");
  }
}
