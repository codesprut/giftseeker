const inquirer = require("inquirer");
const baseSettings = require("./base-settings");

module.exports = service => {
  return baseSettings("cookie", service, () => {
    return inquirer
      .prompt([
        {
          type: "input",
          name: "input",
          prefix: "",
          suffix: ":",
          message: `Enter new cookie value`,
        },
      ])
      .then(async ({ input }) => service.setCookie(input));
  });
};
