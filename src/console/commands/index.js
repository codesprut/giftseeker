const inquirer = require("inquirer");

const listen = () => {
  return inquirer
    .prompt([{ type: "input", name: "Enter command or type 'help'" }])
    .then(async result => {
      const [[, input]] = Object.entries(result);

      console.log("Your input: " + input);

      listen();
    });
};

module.exports = {
  createSession: require("./create-session"),
  listen,
};
