const sessions = require("../sessions");
const inquirer = require("inquirer");

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
      if (input === "exit") {
        console.log("Bye!");
        process.exit(0);
      }

      console.log(`${input}: command not found. Try 'help' or 'list'`);

      listen();
    });
};

module.exports = listen;
