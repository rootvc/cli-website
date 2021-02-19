const commands = {
  help: function() {
    const maxCmdLength = 16;
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

  ls: function() {
    term.writeln("id_rsa     README.md");
  },

  cd: function(args) {
    const dir = args[0];
    term.writeln(`No such directory: ${dir}`);
  },

  cat: function(args) {
    const filename = args[0];
    const readme = "# Nice work! You can check out this code at: https://github.com/rootvc/root3-cli";

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
    term.writeln("emacs not installed. try: vi or vim");
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
    term.writeln("pine not installed. try: Superhuman");
  },

  curl: function() {
    term.writeln("Sorry, CORS isn't going to let you do that from the browser.");
  },

  ftp: function() {
    term.writeln("Sorry, CORS isn't going to let you do that from the browser.");
  },

  ssh: function() {
    term.writeln("Sorry, CORS isn't going to let you do that from the browser.");
  },

  sftp: function() {
    term.writeln("Sorry, CORS isn't going to let you do that from the browser.");
  },

  rm: function() {
    term.writeln("I can't let you do that, Dave.");
  },

  fdisk: function() {
    term.writeln("I can't let you do that, Dave.");
  },

  chown: function() {
    term.writeln("I can't let you do that, Dave.");
  },

  chmod: function() {
    term.writeln("I can't let you do that, Dave.");
  },

  mv: function(args) {
    const src = args[0];
    const dest = args[1];

    if (src == "id_rsa" || src == "README.md") {
      term.writeln(`You do not have permission to move file ${src}.`);
    } else {
      term.writeln(`File not found: ${src}.`);
    }
  },

  cp: function(args) {
    const src = args[0];
    const dest = args[1];

    if (src == "id_rsa" || src == "README.md") {
      term.writeln(`You do not have permission to copy file ${src}.`);
    } else {
      term.writeln(`File not found: ${src}.`);
    }
  },

  touch: function(args) {
    term.writeln("You can't touch this.");
  },

  sudo: function() {
    term.writeln("Sorry, we are root, not you.");
  },

  su: function() {
    term.writeln("Sorry, we are root, not you.");
  },

  exit: function() {
    term.writeln("I'm not locked in here with you. You're locked in here with me!");
  },

  quit: function() {
    term.writeln("I'm not locked in here with you. You're locked in here with me!");
  },

  whois: function(args) {
    const name = args[0];
    switch (name) {
      case 'avidan':
        term.writeln("Avidan!");
        break;
      case 'kane':
        term.writeln("Kane!");
        break;
      case 'chrissy':
        term.writeln("Chrissy!");
        break;
      case 'lee':
        term.writeln("Lee!");
        break;
      default:
        term.writeln(`User ${name} not found. Try: avidan, kane, chrissy, lee.`)
    }
  },

  home: function() {
    openURL("https://root.vc/team");
  },

  commit: function() {
    openURL("https://root.vc/team");
  }
  
}
