const commands = {
  help: function() {
    const maxCmdLength = 12;
    Object.entries(help).forEach(function(kv) {
      var cmd = kv[0];
      const rightPad = maxCmdLength - cmd.length;
      cmd = cmd.concat(" ".repeat(rightPad));
      term.writeln(cmd + kv[1]);
    });
  },

  home: function() {
    openURL("https://root.vc/");
  },
  commit: function() {
    openURL("https://root.vc/team");
  }
  
}
