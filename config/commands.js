const whoisRoot = "Root Ventures is a San Francisco-based hard tech seed fund with $300M+ AUM. We are engineers leading the first venture rounds for technical founders solving hard problems. Our typical check size is $2-3M. We don't mind leading, co-leading, or following. We aim to be your best partner and the investor who best understands your product and your technology. With 2/3 of our fund in reserve, we also want to be your longest term partner, investing in every round, and bridging between rounds when we have to. Try %whois% and one of avidan, kane, chrissy, lee, emily, or laelah to learn more about our team.";
const timeUnit = 1000; // useful for development, set to 10 to run faster, set to 1000 for production
let killed = false;

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
      const description = whoisRoot;
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
        const tabs = c.length > 10 ? "\t" : "\t\t";
        const sep = term.cols >= 76 ? tabs : "\r\n";
        term.stylePrint(`%tldr% ${c}${sep}${data["url"]}`);
        if (term.cols < 76 && c != companies[companies.length - 1]) {
          term.writeln("");
        }
      }
    } else if (!portfolio[name]) {
      term.stylePrint(`Portfolio company ${name} not found. Should we talk to them? Email us: hello@root.vc`);
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
    let dir = args[0] || "~";
    if (dir != "/") {
      // strip trailing slash
      dir = dir.replace(/\/$/, "");
    }

    switch (dir) {
      case "~":
        term.cwd = "~";
        break;
      case "..":
        if (term.cwd == "~") {
          term.command("cd /home");
        } else if (["home", "bin"].includes(term.cwd)) {
          term.command("cd /");
        }
        break;
      case "../..":
      case "../../..":
      case "../../../..":
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
        term.cwd = "bin";
        break;
      case "bin":
        if (term.cwd == "/") {
          term.cwd = "bin";
        } else {
          term.stylePrint(`No such directory: ${dir}`);
        }
        break;
      case ".":
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
    if (filename == "id_rsa") {
      term.openURL("https://gfycat.com/ifr/WhiteBountifulAfricangroundhornbill");
    }
  },

  grep: function(args) {
    const q = args[0];
    const filename = args[1];

    if (filename == "id_rsa") {
      term.openURL("https://gfycat.com/ifr/WhiteBountifulAfricangroundhornbill");
    }

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

    switch (user) {
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

    switch (user) {
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
        break;
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
    if (args[0].split(".")[1] == "htm") {
      term.openURL(`./${args[0]}`, false);
    } else {
      term.command(`cat ${args.join(" ")}`);
    }
  },

  more: function(args) {
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
    term.openURL("mailto:hello@root.vc");
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

  scp: function(args) {
    term.stylePrint(`████████████ Request Blocked: The ███████████ Policy disallows reading the ██████ resource ${args[0]}.`);
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

  kill: function(args) {
    if (args && args.slice(-1) == 337) {
      killed = true;
      term.stylePrint("Phew! Thanks for killing that crypto miner process for us!");
      term.stylePrint("As a thank you for your hard work, please have a special gift on us.");
      term.stylePrint("\r\n%easterbunny% name email streetaddress zip\r\n");
      term.stylePrint("One last thing though. We're going to need to you url encode each of those individual string parameters yourself. Sorry, the crypto miner used up all our resources. This is definitely not a test.")
    } else {
      term.stylePrint("You can't kill me!");
    }
  },

  killall: function(args) {
    term.command(`kill ${args.join(" ")}`);
  },

  easterbunny: async function(args) {
    term.locked = true;

    if (killed) {
      if (term.VERSION != 3) {
        term.stylePrint("%easterbunny% only available in version 3.0. Use %upgrade% to upgrade.");
      } else if (args.length != 4) {
        term.stylePrint("There should be 4 arguments: name email streetaddress zip (each url encoded).")
      }
      else {
        const name = args[0];
        const email = args[1];
        const streetaddress = args[2];
        const zip = args[3];

        const url = `https://hooks.zapier.com/hooks/catch/36670/bzptdx5?Name=${name}&Email=${email}&Address=${streetaddress}&Zip=${zip}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data));

        term.write(`\r\n${colorText("==>", "hyperlink")} Requesting ${url}`);
        await term.progressBar(1 * timeUnit);
        await term.dottedPrint('\r\nRecording your info for a special prize', 3, false);
        term.writeln(data.status);

        term.prompt();
        term.locked = false;
      }
    } else {
      // lol
      term.stylePrint(`Command not found: %easterbunny%. Try 'help' to get started.`);
    }
  },

  keypad: async function(args) {
    term.openURL("https://root.vc/keypad");
  },

  locate: function() {
    term.stylePrint("Root Ventures");
    term.stylePrint("2670 Harrison St");
    term.stylePrint("San Francisco, CA 94110");
  },

  history: function() {
    term.history.forEach((element, index) => {
      term.stylePrint(`${1000 + index}  ${element}`);
    })
  },

  find: function(args) {
    const file = args[0];
    if (Object.keys(_FILES).includes(file)) {
      term.stylePrint(_FULL_PATHS[file]);
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
    } else {
      term.stylePrint("su: Sorry");
    }
  },

  quit: function() {
    term.command("exit");
  },

  stop: function() {
    term.command("exit");
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

  ping: function() {
    term.stylePrint("pong");
  },

  ps: function() {
    term.stylePrint("PID TTY       TIME CMD");
    term.stylePrint("424 ttys00 0:00.33 %-zsh%");
    term.stylePrint("158 ttys01 0:09.70 %/bin/npm start%");
    term.stylePrint("767 ttys02 0:00.02 %/bin/sh%");
    if (!killed) {
      term.stylePrint("337 ttys03 0:13.37 %/bin/cgminer -o pwn.d%");
    }
  },

  uname: function(args) {
    switch (args[0]) {
      case "-a":
        term.stylePrint("RootPC rootpc 0.0.1 RootPC Kernel Version 0.0.1 root:xnu-31415.926.5~3/RELEASE_X86_64 x86_64");
        break;
      case "-mrs":
        term.stylePrint("RootPC 0.0.1 x86_64");
        break;
      default:
        term.stylePrint("RootPC");
    }
  },

  top: function() {
    term.command("ps");
  },

  exit: function() {
    term.command("open welcome.htm");
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
    term.stylePrint("https://docs.anycloudapp.com/documentation/tutorials/aws-node");
  },

  eval: function(args) {
    term.stylePrint("please instead build a webstore with macros. in the meantime, the result is: " + eval(args.join(" ")));
  },

  upgrade: async function() {
    term.VERSION = 3;
    term.init();
    term.locked = true;

    // small convenience method for changing spacing to newlines for mobile
    const m = (str) => term.cols < 40 ? str.replaceAll(/\s\s+/g, "\r\n") : str;

    term.write(`\r\n${colorText("==>", "hyperlink")} Downloading https://ghcr.io/v2/homebrew/core/rootvc/manifests/3.0.0`);
    await term.progressBar(4 * timeUnit);
    term.write(`\r\n${colorText("==>", "hyperlink")} Downloading https://ghcr.io/v2/homebrew/core/rust/blobs/sha256:51869c798355307b59992918e9a595c53072d7a29458dbe5b8d105b63d3dd1c0`);
    await term.progressBar(2 * timeUnit);
    term.write(`\r\n${colorText("==>", "hyperlink")} Downloading from https://pkg-containers.githubusercontent.com/ghcr1/blobs/sha256:51869c798355307b59992918e9a595c53072d7a29458dbe5b8d105b6`);
    await term.progressBar(1 * timeUnit);
    await term.delayStylePrint("\r\n", 1 * timeUnit);
    await term.dottedPrint('Calculating new fund size', 3);
    await term.delayPrint(`Updated fund size:          ${colorText("$150M", "prompt")}\r\n`, 1 * timeUnit);
    await term.delayPrint(`Updated typical check size: ${colorText("$2-3M", "prompt")}\r\n`, 1 * timeUnit);
    await term.delayPrint(m(`Found mission:              ${colorText("Seeding bold engineers.", "user")}\r\n`), 1 * timeUnit);
    await term.delayPrint(m(`Thesis unchanged:           ${colorText("Investing at the earliest stages of technical founders taking engineering risk.", "user")}\r\n`), 1 * timeUnit);
    await term.delayPrint(m(`Required dependencies:      ${colorText("New founders.", "user")}\r\n`), 1 * timeUnit);
    await term.delayStylePrint(m(`Updating jobs:              Found 2 new jobs. Use %jobs% to learn more.`), 1 * timeUnit);

    await term.delayPrint(`\r\n${colorText("You are now running Root Ventures version 3.0.", "hyperlink")}\r\n`, 1 * timeUnit);
    await term.delayStylePrint("Read more here: https://bit.ly/rootvc-fund3", 1 * timeUnit);
    await term.delayPrint("Note that VERSION 3.0 is an unstable build of the terminal.\r\n", 1 * timeUnit);
    await term.delayPrint("Please report any bugs you find.\r\n", 1 * timeUnit);

    term.prompt();
    term.clearCurrentLine();
    term.locked = false;
  },

  jobs: function() {
    term.stylePrint(`[1]   Running                 analyst &`);
    term.stylePrint(`[2]   Running                 hacker &`);
    term.stylePrint("\r\nUse %fg% [id] to see details of a job.")
    term.stylePrint("Yes, we know that's not exactly how %jobs% works, but close enough.");
  },

  bg: function(args) {
    term.stylePrint(`Sorry. If you want to background one of these jobs, you'll need to help us fill it. Try %fg% ${args} instead.`);
  },

  fg: function(args) {
    const job = jobs[args];

    if (job) {
      job.map(line => term.stylePrint(line));
      term.stylePrint(`\r\n%apply% ${args} to apply!`);
    } else {
      term.stylePrint(`job id ${args} not found.`);
    }
  },

  apply: function(args) {
    const email = "join@root.vc";
    const role = (args == 2) ? "hacker in residence" : "analyst";
    const subject = `Applying for ${role} at Root Ventures!`;
    const body = "Wow! I love your website. It's so cool. I definitely want to work with this awesome team. Here's my resume.";
    location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }
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
  return _DIRS[term.cwd].filter((e) => e != 'README.md' || term.user == "root");
}
