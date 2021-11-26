const inquirer = require("inquirer");
const sessions = require("../../sessions");
const baseCommand = require("../base-command");

module.exports = baseCommand(
  "session:create",
  "Create new named session",
  () => {
    return inquirer
      .prompt([
        {
          type: "input",
          name: "input",
          prefix: "",
          suffix: ":",
          message: "Enter new session name",
        },
      ])
      .then(async ({ input }) => {
        // todo: validate name - may be use inquirer filter?
        await sessions.create(input);
      });
  },
);
