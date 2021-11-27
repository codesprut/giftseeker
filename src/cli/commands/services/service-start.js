const translation = require("../../../modules/translation");
const baseCommand = require("../base-command");

module.exports = service =>
  baseCommand(
    `${service.name}:start`,
    translation.get("cli.services.start", service.name),
    async () => {
      const authState = await service.start();

      console.log(`Auth state ${authState}`);
    },
  );
