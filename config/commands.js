const commands = {
  help: function() {
    const maxCmdLength = Math.max(...Object.keys(help).map(x => x.length));
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
      term.stylePrint("%whois%: Learn about the firm, or a partner - usage:\r\n");
      term.stylePrint("%whois% root");
      for (p of people) {
        term.stylePrint(`%whois% ${p}`);
      }
    } else if (name == "root") {
      const description = "Root Ventures is a hard tech seed fund based in San Francisco. With two funds and $150M AUM, we are engineers leading the first venture rounds for technical founders solving hard problems. Our typical check size in Fund II is $1-2M. We don't mind leading, co-leading, or following. Whether we have a board seat or not, we aim to be your best partner and the investor who understands your product and your technology the best. With 2/3 of our fund in reserve, we also want to be your longest term partner, investing in every round, and bridging between rounds when we have to. Try %whois% and one of avidan, kane, chrissy, or lee to learn more about our investing partners.";
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
      term.stylePrint("%whois% root");
      for (p of people) {
        term.stylePrint(`%whois% ${p}`);
      }
    }
  },

  tldr: function(args) {
    const name = (args[0] || "");
    if (!name) {
      const companies = Object.keys(portfolio);
      term.stylePrint("%tldr%: Learn about a portfolio company - usage:\r\n");
      for (c of companies.sort()) {
        const data = portfolio[c];
        const tabs = `\t\t`;
        term.stylePrint(c);
        term.stylePrint(`%tldr% ${c}`+tabs+`${colorText("or", "user")} visit: ${data["url"]}`);
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
    term.displayURL("https://github.com/rootvc/cli-website");
  },

  test: function() {
    term.openURL("https://gfycat.com/ifr/WhiteBountifulAfricangroundhornbill");
  },

  email: function() {
    term.command("pine");
  },

  github: function() {
    term.displayURL("https://github.com/rootvc");
  },

  twitter: function() {
    term.displayURL("https://twitter.com/rootvc");
    term.displayURL("https://twitter.com/machinepix");
  },

  instagram: function() {
    term.displayURL("https://instagram.com/machinepix/");
  },

  insta: function() {
    term.command("instagram");
  },

  other: function() {
    term.stylePrint("Yeah, I didn't literally mean %other%. I mean try some Linux commands");
  },

  echo: function(args) {
    const message = args.join(" ");
    term.stylePrint(message);
  },

  say: function(args) {
    const message = args.join(" ");
    term.stylePrint(`(Robot voice): ${message}`);
  },

  pwd: function() {
    term.stylePrint("/" + term.cwd.replaceAll("~", `home/${term.user}`));
  },

  ls: function() {
    term.stylePrint(_filesHere().join("   "));
  },

  // I am so, so sorry for this code.
  cd: function(args) {
    const dir = args[0];
    
    switch(dir) {
      case "~":
      case "~/":
        term.cwd = "~";
        break;
      case "..":
      case "../":
        if (term.cwd == "~") {
          term.command("cd /home");
        } else if (["home", "bin"].includes(term.cwd)) {
          term.command("cd /");
        }
        break;
      case "../../":
      case "../../../":
      case "../../../../":
      case "/":
        term.cwd = "/";
        break;
      case "home":
        if (term.cwd == "/") {
          term.command("cd /home");
        } else {
          term.stylePrint(`You do not have permission to access this directory`);
        }
        break;
      case "/home":
        term.cwd = "home";
        break;
      case "guest":
      case "root":
        if (term.cwd == "home") {
          if (term.user == dir) {
            term.command("cd ~");
          } else {
            term.stylePrint(`You do not have permission to access this directory`);
          }
        } else {
          term.stylePrint(`No such directory: ${dir}`);
        }
        break;
      case "../home/avidan":
      case "../home/kane":
      case "../home/chrissy":
      case "../home/lee":
      case "../home/emily":
      case "../home/laelah":
        if (term.cwd == "~" || term.cwd == "bin") {
          term.command(`cd ${dir.split("/")[2]}`);
        } else {
          term.stylePrint(`No such directory: ${dir}`);
        }
        break;
      case "/home/avidan":
      case "/home/kane":
      case "/home/chrissy":
      case "/home/lee":
      case "/home/emily":
      case "/home/laelah":
      case "avidan":
      case "kane":
      case "chrissy":
      case "lee":
      case "emily":
      case "laelah":
        term.stylePrint(`You do not have permission to access this directory`);
        break;
      case "/bin":
        term.command("bin")
        break;
      case "bin":
        if (term.cwd == "/") {
          term.cwd = "bin";
        } else {
          term.stylePrint(`No such directory: ${dir}`);
        }
        break;
      case "":
      case ".":
      case "./":
        break;
      default:
        term.stylePrint(`No such directory: ${dir}`);
        break;
    }
  },

  zsh: function() {
    term.init(term.user);
  },

  cat: function(args) {
    const filename = args[0];

    if (_filesHere().includes(filename)) {
      term.writeln(getFileContents(filename));
    } else {
      term.stylePrint(`No such file: ${filename}`);
    }
  },

  grep: function(args) {
    const q = args[0];
    const filename = args[1];

    if (!q || !filename) {
      term.stylePrint("usage: %grep% [pattern] [filename]");
      return;
    }

    if (_filesHere().includes(filename)) {
      var file = getFileContents(filename);
      const matches = file.matchAll(q);
      for (match of matches) {
        file = file.replaceAll(match[0], colorText(match[0], "files"));
      } 
      term.writeln(file);
    } else {
      term.stylePrint(`No such file or directory: ${filename}`);
    }
  },

  finger: function(args) {
    const user = args[0];

    switch(user) {
      case 'guest':
        term.stylePrint("Login: guest            Name: Guest");
        term.stylePrint("Directory: /home/guest  Shell: /bin/zsh");
        break;
      case 'root':
        term.stylePrint("Login: root             Name: That's Us!");
        term.stylePrint("Directory: /home/root   Shell: /bin/zsh");
        break;
      case 'avidan':
      case 'kane':
      case 'chrissy':
      case 'lee':
      case 'emily':
      case 'laelah':
        term.stylePrint(`Login: ${user}   Name: ${team[user]["name"]}`);
        term.stylePrint(`Directory: /home/${user}   Shell: /bin/zsh`);
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
        term.stylePrint("guest lps founders engineers investors");
        break;
      case 'root':
        term.stylePrint("wheel investors engineers hardtech firms");
        break;
      case 'avidan':
        term.stylePrint("wheel investors engineers managingpartner handypersons tinkers agtech foodtech foodies coffeesnobs");
        break;
      case 'kane':
        term.stylePrint("wheel investors engineers partners tinkers mcad motorcyclists gearheads machinepix sportshooters gamers");
        break;
      case 'chrissy':
        term.stylePrint("wheel investors engineers partners electrical manufacturing ecad wearables healthtech gearheads automotive sportshooters");
        break;
      case 'lee':
        term.stylePrint("wheel investors engineers partners software devtools data ai+ml gamers winesnobs");
        break;
      case 'emily':
        term.stylePrint("wheel investors engineers principals mechanical space automotive winesnobs");
      case 'laelah':
        term.stylePrint("wheel admin operations miracleworkers gamers");
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
    term.command(`cat ${args.join(" ")}`);
  },

  less: function(args) {
    term.command(`cat ${args.join(" ")}`);
  },

  head: function(args) {
    term.command(`cat ${args.join(" ")}`);
  },

  open: function(args) {
    term.command(`cat ${args.join(" ")}`);
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
    term.openURL("mailto:team@root.vc");
  },

  curl: function(args) {
    term.stylePrint(`Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource ${args[0]}.`);
  },

  ftp: function(args) {
    term.command(`curl ${args.join(" ")}`);
  },

  ssh: function(args) {
    term.command(`curl ${args.join(" ")}`);
  },

  sftp: function(args) {
    term.command(`curl ${args.join(" ")}`);
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
    term.command("rm");
  },

  chown: function() {
    term.stylePrint("You do not have permission to %chown%");
  },

  chmod: function() {
    term.stylePrint("You do not have permission to %chmod%");
  },

  mv: function(args) {
    const src = args[0];

    if (_filesHere().includes(src)) {
      term.stylePrint(`You do not have permission to move file ${src}`);
    } else {
      term.stylePrint(`%mv%: ${src}: No such file or directory`);
    }
  },

  cp: function(args) {
    const src = args[0];

    if (_filesHere().includes(src)) {
      term.stylePrint(`You do not have permission to copy file ${src}`);
    } else {
      term.stylePrint(`%cp%: ${src}: No such file or directory`);
    }
  },

  touch: function() {
    term.stylePrint("You can't %touch% this");
  },

  sudo: function(args) {
    if (term.user == "root") {
      term.command(args.join(" "));
    }
    else {
      term.stylePrint(`${colorText(term.user, "user")} is not in the sudoers file. This incident will be reported`);
    }
  },

  su: function(args) {
    user = args[0] || "root";

    if (user == "root" || user == "guest") {
      term.user = user;
      term.command("cd ~");
    } 
  },

  exit: function() {
    window.removeEventListener("resize", term.resizeListener);
    term.reset();
    term.write("Thanks for playing. Come back soon!");
    term._initialized = false;
    return 1;
  },

  quit: function() {
    term.command("exit");
  },

  stop: function() {
    term.stylePrint("Can't stop, won't stop");
  },

  whoami: function() {
    term.stylePrint(term.user);
  },

  passwd: function() {
    term.stylePrint("Wow. Maybe don't enter your password into a sketchy web-based term.command prompt?");
  },

  man: function(args) {
    term.command(`tldr ${args}`);
  },

  woman: function(args) {
    term.command(`tldr ${args}`);
  },

  ps: function() {
    term.stylePrint("PID TTY       TIME CMD");
    term.stylePrint("424 ttys00 0:00.33 %-zsh%");
    term.stylePrint("158 ttys01 0:09.70 %/bin/npm start%");
    term.stylePrint("767 ttys02 0:00.02 %/bin/sh%");
    term.stylePrint("337 ttys03 0:13.37 %/bin/cgminer -o pwn.d%");
  },

  uname: function(args) {
    switch(args[0]) {
      case "-a":
        term.stylePrint("RootPC rootpc 0.0.1 RootPC Kernal Version 0.0.1 root:xnu-31415.926.5~3/RELEASE_X86_64 x86_64");
        break;
      case "-mrs":
        term.stylePrint("RootPC 0.0.1 x86_64");
        break;
      default:
        term.stylePrint("RootPC");
    }
  },

  clear: function() {
    term.init();
  },

  zed: function() {
    term.stylePrint("Coming soon! ;)");
  },

  ge: function() {
    term.command("great_expectations");
  },

  great_expectations: function() {
    term.command("superconductive");
  },

  privacy: function() {
    term.command("privacy_dynamics");
  },

  ln: function() {
    term.command("alan");
  },

  anycloud: function() {
    term.command("alan");
  },
}

// Add commands for company demos
for (kv of Object.entries(portfolio)) {
  const key = kv[0];
  const val = kv[1];

  if (val["demo"]) {
    commands[key] = () => term.displayURL(val["demo"]);
  }
}

function _filesHere() {
  return DIRS[term.cwd].filter((e) => e != 'README.md' || term.user == "root" );
}