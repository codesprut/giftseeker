const { Table } = require("console-table-printer");
const baseCommand = require("./base-command");

module.exports = commands =>
  baseCommand(
    "help|list",
    "Displays all available commands. Provide argument for filter e.g., help session",
    args => {
      const table = new Table({
        columns: [{ name: "signature", alignment: "left", color: "green" }],
      });

      const commandsToPrint = commands.filter(command =>
        args[0] ? command.signature.match(args[0]) : true,
      );

      if (!commandsToPrint.length) {
        return false;
      }

      commandsToPrint.forEach(({ signature, description }) => {
        table.addRow({ signature, description });
      });

      table.printTable();

      return true;
    },
  );
