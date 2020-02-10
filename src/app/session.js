const { session } = require("electron");

const { appName, defaultUseragent } = require("./config");
const settings = require("./settings");

const _session = session.fromPartition(`persist:${appName}`);
_session.setUserAgent(settings.get("user_agent", defaultUseragent));

module.exports = _session;
