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
    term.writeln("You do not have permission to chown.");
  },

  chmod: function() {
    term.writeln("You do not have permission to chmod.");
  },

  mv: function(args) {
    const src = args[0];
    const dest = args[1];

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
    term.writeln("LP not in the sudoers file. This incident will be reported.");
  },

  su: function() {
    term.writeln("LP not in the sudoers file. This incident will be reported.");
  },

  exit: function() {
    openURL("https://app.box.com/v/rootventures");
  },

  quit: function() {
    openURL("https://app.box.com/v/rootventures");
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

  linkedin: function(args) {
    const name = args[0];
    switch (name) {
      case 'avidan':
        openURL("https://www.linkedin.com/in/avidanross/");
        break;
      case 'kane':
        openURL("https://www.linkedin.com/in/kanehsieh/");
        break;
      case 'chrissy':
        openURL("https://www.linkedin.com/in/kanehsieh/");
        break;
      case 'lee':
        openURL("https://www.linkedin.com/in/leeredwards/");
        break;
      case 'emily':
        openURL("https://www.linkedin.com/in/emily-henriksson-42959737/");
        break;
      case 'ian':
        openURL("https://www.linkedin.com/in/ian-rust-85a41b43/");
        break;
      default:
        term.writeln(`User ${name} not found. Try: linkedin avidan, kane, chrissy, lee, emily, ian.`)
    }
  },

  whois: function(args) {
    const name = args[0];
    switch (name) {
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
      case 'ian':
        term.writeln("Ian has worked on industrial automation on Amazon Echo and Google Glass. He was also Founding Engineer at Cruise Automation, a self-driving car startup that was acquired by General Motors. He's currently an Entrepreneur in Residence at Root Ventures, looking to build something new.\r\nhttps://www.linkedin.com/in/ian-rust-85a41b43/");
        break;
      default:
        term.writeln(`User ${name} not found. Try: whois avidan, kane, chrissy, lee, emily, ian.`)
    }
  },

  dataroom: function(args) {
    const name = args[0];
    switch (name) {
      case 'main':
        openURL("https://app.box.com/v/rootventures");
        break;
      case 'memos':
        openURL("https://app.box.com/s/fk0c82408djzu0irw3nyetegz11bh3iv");
        break;
      case 'founders':
        openURL("https://app.box.com/s/0jwczqvu1p5xoksubk2d1dyz4oww4vs3");
        break;
      case 'reporting':
        openURL("https://app.box.com/s/vt6jq1zosed3vpmenrmr46omqdvv9prb");
        break;
      case 'legal':
        openURL("https://app.box.com/s/n0webobsuj1zxvxwn1enz8xglj517z5s");
        break;
      case 'social':
        openURL("https://twitter.com/machinepix");
        break;
      case 'team':
        openURL("https://app.box.com/s/ao492cv93xw9l6lnlogpmv6gqyoyudr8");
        break;
      default:
        term.writeln(`examples: dataroom main, dataroom memos, dataroom founders, dataroom reporting, dataroom legal, dataroom social, dataroom team`);
    }
  },

  home: function() {
    openURL("https://root.vc/team");
  },

  test: function() {
    openURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstleyVEVO");
  },

  email: function() {
    openURL("mailto:avidan@root.vc");
  },

  deck: function() {
    openURL("https://app.box.com/s/pkxweaj40395wcd6k6q3yiijpv3uv8yu");
  }
  
}
