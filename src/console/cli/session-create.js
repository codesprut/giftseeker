const inquirer = require("inquirer");
const sessions = require("../sessions");

module.exports = () => {
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
};
