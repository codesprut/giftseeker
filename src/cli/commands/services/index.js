const startCommand = require("./service-start");
const stopCommand = require("./service-stop");
const settingsCommands = require("./settings");

module.exports = services => {
  const commands = [];

  for (const service of services) {
    commands.push(startCommand(service));
    commands.push(stopCommand(service));
    commands.push(...settingsCommands(service));
  }

  return commands;
};
