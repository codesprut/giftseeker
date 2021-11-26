const sessions = require("../sessions");
const inquirer = require("inquirer");

module.exports = commands => {
  const listen = () => {
    const sessionName = sessions.current().name;

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
        const command = commands.find(it =>
          it.signature.split("|").includes(input),
        );

        if (command) {
          await command.action();
        } else {
          console.log(`command not found. Try 'help' or 'list'`);
        }

        listen();
      });
  };

  return listen;
};
