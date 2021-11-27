const startCommand = require("./service-start");

module.exports = services => {
  const commands = [];

  for (const service of services) {
    commands.push(startCommand(service));
  }

  return commands;
};
