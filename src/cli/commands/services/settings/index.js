const numberCommands = require("./number-commands");
const cookieCommands = require("./cookie-commands");
const settingType = require("../../../../core/services/settings/setting-type.enum");

const commandsByType = {
  [settingType.INTEGER]: numberCommands,
  [settingType.FLOAT]: numberCommands,
};

module.exports = service => {
  const commands = [];

  commands.push(...cookieCommands(service));

  for (const [settingName, setting] of Object.entries(service.settings)) {
    const typedCommands = commandsByType[setting.type];

    if (typedCommands) {
      commands.push(...typedCommands(settingName, service));
    }
  }

  return commands;
};
