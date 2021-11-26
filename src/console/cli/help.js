const os = require("os");
const baseCommand = require("./base-command");

module.exports = commands =>
  baseCommand("help|list", "Displays all available commands", () => {
    console.log(
      commands.reduce(
        (output, { signature, description }) =>
          output + `${signature}: ${description}${os.EOL}`,
        "",
      ),
    );
  });
