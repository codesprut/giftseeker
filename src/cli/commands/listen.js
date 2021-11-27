const session = require("../session");
const inquirer = require("inquirer");

module.exports = commands => {
  const listen = () => {
    const sessionName = session.current().name;

    return inquirer
      .prompt([
        {
          type: "input",
          name: "input",
          prefix: "",
          suffix: "$",
          message: `GiftSeeker CLI (session:${sessionName})\n`,
        },
      ])
      .then(async ({ input }) => {
        const [inputCommand, ...args] = input.split(" ");

        const command = commands.find(it =>
          it.signature.split("|").includes(inputCommand),
        );

        if (command) {
          await command.action(args);
        } else {
          console.log(`command not found. Try 'help' or 'list'`);
        }

        listen();
      });
  };

  listen();
};
