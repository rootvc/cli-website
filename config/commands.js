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
    term.writeln("README.md");
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
    } else {
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
