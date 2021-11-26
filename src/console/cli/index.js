const session = require("./session");
const exit = require("./exit");
const help = require("./help");

const commands = [...Object.values(session)];

commands.push(exit);
commands.push(help(commands));

module.exports = {
  sessionCreate: session.sessionCreate.action,
  listen: require("./listen")(commands),
};
