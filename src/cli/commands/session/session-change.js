const session = require("../../session");
const baseCommand = require("../base-command");
const inquirer = require("inquirer");

module.exports = baseCommand("session:change", "Change current session", () => {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "input",
        prefix: "",
        suffix: ":",
        message: "Choice active session",
        choices: session.list().map(it => it.name),
      },
    ])
    .then(async ({ input }) => {
      session.select(input);
    });
});
