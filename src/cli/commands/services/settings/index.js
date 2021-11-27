const numberCommands = require("./number-settings");
const dataType = require("./data-type.enum");

const commandsByType = {
  number: numberCommands(dataType.INT),
  float_number: numberCommands(dataType.FLOAT),
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
