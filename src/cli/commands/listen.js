const session = require("../session");
const inquirer = require("inquirer");

const printHelpInfo = (commandsList, input) => {
  const sameCommandsFound = commandsList
    .find(it => it.signature === "help|list")
    .action([input]);

  console.info("Command not found");

  if (sameCommandsFound) {
    console.info(`Check out same commands or try 'help'`);
    return;
  }

  console.info("Try 'help' or 'list'");
};

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
          printHelpInfo(commands, inputCommand);
        }

        listen();
      });
  };

  listen();
};
