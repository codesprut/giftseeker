const isPortable = process.env.PORTABLE_EXECUTABLE_DIR !== undefined;
const execPath = isPortable
  ? `${process.env.PORTABLE_EXECUTABLE_DIR}\\`
  : process.execPath.match(/.*\\/i)[0];

module.exports = {
  isPortable,
  execPath,
  devMode: process.argv[1] === "."
};
