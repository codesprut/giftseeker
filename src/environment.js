const os = require("os");
const path = require("path");
const isPortable = process.env.PORTABLE_EXECUTABLE_DIR !== undefined;
const execPath = isPortable
  ? `${process.env.PORTABLE_EXECUTABLE_DIR}\\`
  : process.cwd();

module.exports = {
  isPortable,
  execPath,
  appRoot: path.resolve(__dirname),
  devMode: process.argv[1] === ".",
  EOL: os.EOL,
  homedir: os.homedir(),
};
