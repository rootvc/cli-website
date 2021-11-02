// TODO add explicit imports in commands.js rather than relying on globals
global.term = require("../js/terminal-ext")({});
global.portfolio = require("./portfolio");
global.commands = require("./commands");

test.each([
  ["<anything>", "/", "/"],
  ["<anything>", "~", "~"],
  ["<anything>", "~/", "~"],
  ["~", "..", "home"],
  ["~", "../", "home"],
  ["<anything>", "../../", "/"],
  ["<anything>", "../..", "/"],
  ["<anything>", "../../../", "/"],
  ["<anything>", "../../../../", "/"],
  ["<anything>", "/", "/"],
  ["/", "home", "home"],
  ["<anything>", "/home", "home"],
  ["/", "bin", "bin"],
  ["<anything>", ".", "<anything>"],
  ["<anything>", "./", "<anything>"],
  ["<anything>", "", "~"],
  ["<anything>", "/bin", "bin"],
])("command.cd(%s, %s)", (initial, args, expected) => {
  term.cwd = initial;
  term.command("cd " + args);
  expect(term.cwd).toBe(expected);
});
