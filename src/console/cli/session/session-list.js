const os = require("os");
const sessions = require("../../sessions");
const baseCommand = require("../base-command");

module.exports = baseCommand(
  "session:list",
  "List all available sessions",
  () => {
    console.log(
      sessions
        .list()
        .reduce(
          (result, session, index) =>
            result + `${index + 1}: ` + session.name + os.EOL,
          "",
        ),
    );
  },
);
