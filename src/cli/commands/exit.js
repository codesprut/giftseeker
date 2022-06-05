const baseCommand = require("./base-command");

module.exports = baseCommand(
  "exit|quit",
  "Save settings and close application",
  () => {
    console.log("Bye!");
    process.exit(0);
  },
);
