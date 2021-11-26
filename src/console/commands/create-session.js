const inquirer = require("inquirer");
const sessions = require("../sessions");

module.exports = () => {
  return inquirer
    .prompt([{ type: "input", name: "Enter new session name" }])
    .then(async input => {
      const [[, value]] = Object.entries(input);

      await sessions.create(value);
    });
};
