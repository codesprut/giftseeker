const startCommand = require("./service-start");
const stopCommand = require("./service-stop");

module.exports = services => {
  const commands = [];

  for (const service of services) {
    commands.push(startCommand(service));
    commands.push(stopCommand(service));
  }

  return commands;
};
