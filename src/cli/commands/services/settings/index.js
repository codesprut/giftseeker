const numberCommands = require("./number-settings");

const commandsByType = {
  number: numberCommands,
  float_number: numberCommands,
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
