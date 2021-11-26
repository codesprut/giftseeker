const os = require("os");
const session = require("../../session");
const baseCommand = require("../base-command");

module.exports = baseCommand(
  "session:list",
  "List all available sessions",
  () => {
    console.log(
      session
        .list()
        .reduce(
          (result, session, index) =>
            result + `${index + 1}: ` + session.name + os.EOL,
          "",
        ),
    );
  },
);
