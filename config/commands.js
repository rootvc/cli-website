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
    term.writeln("lp");
  },

  passwd: function() {
    term.write("Maybe don't enter your password into a sketchy web-based command prompt?");
  },

  whois: function(args) {
    const name = args[0];
    switch (name) {
      case 'root':
        term.writeln("Root Ventures is a seed stage fund based in San Francisco. All of us are engineers investing in the technical areas we know well - from software, to electrical engineering, to hard industry, and robotics. We invest out of our second fund at the seed or pre-seed stage with lead or co-lead sized checks.");
        break;
      case 'avidan':
        term.writeln("Avidan is the Founding Partner of Root Ventures. Previously, he designed industrial robotics for Food Network's kitchens and was CTO of CIM Group, where he focused on industrial investing, and worked as an embedded application developer at Excite@Home. Avidan has a BA in Computer Science from Columbia University.\r\nhttps://www.linkedin.com/in/avidanross/");
        break;
      case 'kane':
        term.writeln("Before joining Root Ventures, Kane was founder and Head of Product at Brilliant Bicycle Co. He has also worked as an early-stage investor at RRE Ventures, a software engineer at Romotive, and a Project Manager at Microsoft. Kane has an AB in Computer Science from Harvard.\r\nhttps://www.linkedin.com/in/kanehsieh/");
        break;
      case 'chrissy':
        term.writeln("Chrissy has spent the past decade developing and shipping hardware as an engineering manager at Apple and Square. She was a founding team member at Pearl Automation, a vehicle technology startup. Chrissy has an MS in Electrical Engineering from Stanford and a BSEE from Rose-Hulman.\r\nhttps://www.linkedin.com/in/kanehsieh/");
        break;
      case 'lee':
        term.writeln("Lee was most recently CTO at Teespring. Previously, Lee was a mechanical engineer at iRobot, a software engineer at Pivotal Labs, Lead Engineer at SideTour (acquired by Groupon in 2013), and engineering manager for GrouponLive. He graduated from Olin College of Engineering with a degree in Systems Engineering.\r\nhttps://www.linkedin.com/in/leeredwards/");
        break;
      case 'emily':
        term.writeln("Emily is an MBA candidate at HBS. Prior to Root, she designed flight hardware for the SpaceX Falcon and supervised vehicle build for schedule-critical missions. She also worked on Model 3 battery module prototyping at Tesla. Emily holds MS and BS degrees in Mechanical Engineering from Stanford where she was a captain for the Division I Women’s Field Hockey Team.\r\nhttps://www.linkedin.com/in/emily-henriksson-42959737/");
        break;
      case 'laelah':
        term.writeln("Laelah has spent over 15 years in marketing for films, consumer products, and subscription-based services. Laelah Reino has a BA in Business Administration with a Marketing concentration from Drexel University.\r\nhttps://www.linkedin.com/in/laelah-reino-78b6a51/");
        break;
      default:
        term.writeln(`User ${name} not found. examples:\r\nwhois avidan\r\nwhois kane\r\nwhois chrissy\r\nwhois lee\r\nwhois emily\r\nwhois laelah\r\n`)
    }
  },

  home: function() {
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
