const baseCommand = require("./base-command");

module.exports = baseCommand(
  "exit",
  "Save settings and close application",
  () => {
    console.log("Bye!");
    process.exit(0);
  },
);
