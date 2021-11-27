const { Table } = require("console-table-printer");
const baseCommand = require("./base-command");

module.exports = commands =>
  baseCommand("help|list", "Displays all available commands", () => {
    const table = new Table({
      columns: [{ name: "signature", alignment: "left", color: "green" }],
    });

    commands.forEach(({ signature, description }) => {
      table.addRow({ signature, description });
    });

    table.printTable();
  });
