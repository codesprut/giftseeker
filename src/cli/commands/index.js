const session = require("./session");
const exit = require("./exit");
const help = require("./help");

const commands = [...Object.values(session)];

commands.push(help(commands));
commands.push(exit);

module.exports = {
  sessionCreate: session.sessionCreate.action,
  listen: require("./listen")(commands),
};
