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
        term.writeln("User " + name + " not found. Try: avidan, kane, chrissy, lee.")
    }
  },

  home: function() {
    openURL("https://root.vc/team");
  },

  commit: function() {
    openURL("https://root.vc/team");
  }
  
}
