const translation = require("../../../modules/translation");
const baseCommand = require("../base-command");
const chalk = require("chalk");

module.exports = service =>
  baseCommand(
    `${service.name}:stop`,
    translation.get("cli.services.stop", service.name),
    async () => {
      const success = await service.stop();

      if (success) {
        console.log(chalk.greenBright(`${service.name} stopped successfully`));
        return;
      }

      console.log(chalk.red(`${service.name} is not running`));
    },
  );
