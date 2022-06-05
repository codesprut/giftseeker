const sessionCommands = require("./session");
const servicesCommands = require("./services");
const exit = require("./exit");
const help = require("./help");
const listen = require("./listen");

module.exports = {
  sessionCreate: sessionCommands.sessionCreate.action,
  listen: services => {
    const commands = [
      ...Object.values(sessionCommands),
      ...Object.values(servicesCommands(services)),
    ];

    commands.push(help(commands));
    commands.push(exit);

    listen(commands);
  },
};
