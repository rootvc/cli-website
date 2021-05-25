const commands = {
  help: function() {
    const maxCmdLength = Math.max(...Object.keys(help).map(x => x.length));
    term.writeln("");
    Object.entries(help).forEach(function(kv) {
      const cmd = kv[0];
      const desc = kv[1];
      if (term.cols >= 80) {
        const rightPad = maxCmdLength - cmd.length + 2;
        const sep = " ".repeat(rightPad);
        term.stylePrint(`${cmd}${sep}${desc}`);
      } else {
        if (cmd != 'help') { // skip second leading newline
          term.writeln("");
        }
        term.stylePrint(cmd);
        term.stylePrint(desc);
      }
    })
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
    displayURL("https://twitter.com/rootvc");
    displayURL("https://twitter.com/machinepix");
  },

  instagram: function() {
    displayURL("https://www.instagram.com/machinepix/");
  },

  other: function() {
    term.stylePrint("Yeah, I didn't literally mean %other%. I mean try some Linux commands");
  },

  echo: function(args) {
    const message = args.join(" ");
    term.stylePrint(`\r\n${message}`);
  },

  say: function(args) {
    const message = args.join(" ");
    term.stylePrint(`\r\n(Robot voice): ${message}`);
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
      term.stylePrint("Nice try");
    }
    else {
      term.stylePrint(`No such file: ${filename}`);
    }
  },

  grep: function(args) {
    const q = args[0];
    const filename = args[1];
    var readme = "_aut inveniam viam aut faciam_";

    if (!q || !filename) {
      term.stylePrint("usage: %grep% [pattern] [filename]");
      return;
    }

    if (filename == "readme.md") {
      const matches = readme.matchAll(q);
      for (match of matches) {
        readme = readme.replaceAll(match[0], colorText(match[0], "files"));
      } 
      term.writeln(readme);
    } else if (filename == "id_rsa") {
      term.stylePrint("Nice try");
    }
    else {
      term.stylePrint(`No such file or directory: ${filename}`);
    }
  },

  finger: function(args) {
    const user = args[0];

    switch(user) {
      case 'guest':
        term.stylePrint("Login: guest            Name: Guest");
        term.stylePrint("Directory: /home/guest  Shell: /bin/zsh");
        term.stylePrint("No Mail.");
        term.stylePrint("No Plan.");
        break;
      case 'root':
        term.stylePrint("Login: root             Name: That's Us!");
        term.stylePrint("Directory: /root        Shell: /bin/zsh");
        term.stylePrint("Ugh, so much Mail.");
        term.stylePrint("Epic Plan.");
        break;
      case 'avidan':
      case 'kane':
      case 'chrissy':
      case 'lee':
      case 'emily':
      case 'laelah':
        term.stylePrint(`Login: ${user}   Name: ${team[user]["name"]}`);
        term.stylePrint(`Directory: /home/${user}   Shell: /bin/zsh`);
        term.stylePrint("Ugh, so much Mail.");
        term.stylePrint("Epic Plan.");
        break;
      default:
        term.stylePrint(user ? `%finger%: ${user}: no such user` : "usage: %finger% [user]");
        break;
    }
  },

  groups: function(args) {
    const user = args[0];

    switch(user) {
      case 'guest':
        term.stylePrint("staff everyone guest lps founders engineers investors");
        break;
      case 'root':
        term.stylePrint("wheel staff everyone admin engineers investors firms");
        break;
      case 'avidan':
        term.stylePrint("wheel staff everyone admin engineers investors managingpartner handypersons tinkers agtech foodtech foodies coffeesnobs");
        break;
      case 'kane':
        term.stylePrint("wheel staff everyone admin engineers investors partners tinkers mcad motorcyclists gearheads machinepix sportshooters gamers");
        break;
      case 'chrissy':
        term.stylePrint("wheel staff everyone admin engineers investors partners electrical mfg ecad wearables healthtech gearheads automotive sportshooters");
        break;
      case 'lee':
        term.stylePrint("wheel staff everyone admin engineers investors partners software devtools data ai+ml gamers winesnobs");
        break;
      case 'emily':
        term.stylePrint("wheel staff everyone admin engineers investors principals mechanical space automotive winesnobs");
      case 'laelah':
        term.stylePrint("wheel staff everyone admin operations miracleworkers gamers");
        break;
      default:
        term.stylePrint(user ? `%groups%: ${user}: no such user` : "usage: %groups% [user]");
        break;
    }
  },

  gzip: function() {
    term.stylePrint("What are you going to do with a zip file on a fake terminal, seriously?");
  },

  free: function() {
    term.stylePrint("Honestly, our memory isn't what it used to be");
  },

  tail: function(args) {
    command(`cat ${args.join(" ")}`);
  },

  less: function(args) {
    command(`cat ${args.join(" ")}`);
  },

  head: function(args) {
    command(`cat ${args.join(" ")}`);
  },

  open: function(args) {
    command(`cat ${args.join(" ")}`);
  },

  emacs: function() {
    term.stylePrint("%emacs% not installed. try: %vi%");
  },

  vim: function() {
    term.stylePrint("%vim% not installed. try: %emacs%");
  },

  vi: function() {
    term.stylePrint("%vi% not installed. try: %emacs%");
  },

  pico: function() {
    term.stylePrint("%pico% not installed. try: %vi% or %emacs%");
  },

  nano: function() {
    term.stylePrint("%nano% not installed. try: %vi% or %emacs%");
  },

  pine: function() {
    openURL("mailto:team@root.vc");
  },

  curl: function(args) {
    term.stylePrint(`Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource ${args[0]}.`);
  },

  ftp: function(args) {
    command(`curl ${args.join(" ")}`);
  },

  ssh: function(args) {
    command(`curl ${args.join(" ")}`);
  },

  sftp: function(args) {
    command(`curl ${args.join(" ")}`);
  },

  rm: function() {
    term.stylePrint("I can't let you do that, Dave");
  },

  mkdir: function() {
    term.stylePrint("Come on, don't mess with our immaculate file system");
  },

  alias: function() {
    term.stylePrint("Just call me HAL");
  },

  df: function() {
    term.stylePrint("Nice try. Just get a Dropbox");
  },

  kill: function() {
    term.stylePrint("Easy, killer");
  },

  history: function() {
    term.history.forEach((element, index) => {
      term.stylePrint(`${1000 + index}  ${element}`);
    })
  },

  find: function(args) {
    const file = args[0];
    if (src == "id_rsa" || src == "readme.md") {
      term.stylePrint(file);
    } else {
      term.stylePrint(`%find%: ${file}: No such file or directory`);
    }
  },

  fdisk: function() {
    command("rm");
  },

  chown: function() {
    term.stylePrint("You do not have permission to %chown%");
  },

  chmod: function() {
    term.stylePrint("You do not have permission to %chmod%");
  },

  mv: function(args) {
    const src = args[0];

    if (src == "id_rsa" || src == "readme.md") {
      term.stylePrint(`You do not have permission to move file ${src}`);
    } else {
      term.stylePrint(`mv: ${src}: No such file or directory`);
    }
  },

  cp: function(args) {
    const src = args[0];

    if (src == "id_rsa" || src == "readme.md") {
      term.stylePrint(`You do not have permission to copy file ${src}`);
    } else {
      term.stylePrint(`cp: ${src}: No such file or directory`);
    }
  },

  touch: function() {
    term.stylePrint("You can't %touch% this");
  },

  sudo: function() {
    term.stylePrint("guest not in the sudoers file. This incident will be reported");
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
    term.stylePrint("Can't stop, won't stop");
  },

  whoami: function() {
    term.stylePrint("guest");
  },

  passwd: function() {
    term.stylePrint("Wow. Maybe don't enter your password into a sketchy web-based command prompt?");
  },

  man: function(args) {
    command(`tldr ${args}`);
  },

  woman: function(args) {
    command(`tldr ${args}`);
  },

  ps: function() {
    term.stylePrint("PID TTY       TIME CMD");
    term.stylePrint("424 ttys00 0:00.33 %-zsh%");
    term.stylePrint("158 ttys01 0:09.70 %/bin/npm start%");
    term.stylePrint("767 ttys02 0:00.02 %/bin/sh%");
    term.stylePrint("337 ttys03 0:13.37 %/bin/cgminer -o pwn.d%");
  },

  ge: function() {
    command("greatexpectations");
  },

  great_expectations: function() {
    command("greatexpectations");
  },

  zed: function() {
    term.stylePrint("Coming soon! ;)");
  },

  privacy: function() {
    command("privacydynamics");
  },
}

// Add commands for company demos
for (kv of Object.entries(portfolio)) {
  const key = kv[0];
  const val = kv[1];

  if (val["demo"]) {
    commands[key] = () => displayURL(val["demo"]);
  }
}