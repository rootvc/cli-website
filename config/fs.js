const FILES = {
  "id_rsa": "Nice try!",
  "README.md": "# Root Ventures\r\n## Seeding bold engineers.\r\n\r\n_aut inveniam viam aut faciam_",
};

const DIRS = {
  "~": ["id_rsa", "README.md"],
  "bin": ["zsh"],
  "home": Object.keys(team).concat("guest", "root").sort(),
  "/": ["bin", "home"],
};