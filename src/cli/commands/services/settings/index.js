const numberCommands = require("./number-settings");
const settingType = require("../../../../core/services/settings/setting-type.enum");

const commandsByType = {
  [settingType.INTEGER]: numberCommands,
  [settingType.FLOAT]: numberCommands,
};

module.exports = service => {
  const commands = [];

  for (const [settingName, setting] of Object.entries(service.settings)) {
    const typedCommands = commandsByType[setting.type];

    if (typedCommands) {
      commands.push(...typedCommands(settingName, service));
    }
  }

  return commands;
};
