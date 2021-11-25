const { createInterface } = require("readline");

const cli = createInterface(process.stdin, process.stdout);

cli.setPrompt("");
cli.prompt();

cli
  .on("line", input => {
    if (input === "exit") {
      cli.close();
    }

    console.error(`No '${input}' command found;`);

    cli.prompt();
  })
  .on("close", () => process.exit(0));
