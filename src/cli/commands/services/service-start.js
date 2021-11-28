const chalk = require("chalk");

const translation = require("../../../modules/translation");
const authState = require("../../../core/auth-state.enum");
const baseCommand = require("../base-command");

module.exports = service =>
  baseCommand(
    `${service.name}:start`,
    translation.get("cli.services.start", service.name),
    async () => {
      if (service.isStarted()) {
        console.log(chalk.greenBright(`${service.name} already started`));
        return;
      }

      const currentAuthState = await service.start();

      if (currentAuthState === authState.AUTHORIZED) {
        console.info(chalk.greenBright(`${service.name} successfully started`));
        return;
      }
      if (currentAuthState === authState.NOT_AUTHORIZED) {
        console.info(chalk.red(`Not authorized. Set cookie before`));
        return;
      }
      if (currentAuthState === authState.CONNECTION_REFUSED) {
        console.info(chalk.red(translation.get("service.connection_error")));
      }
    },
  );
