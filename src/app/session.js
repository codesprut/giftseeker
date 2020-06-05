const { session } = require("electron");

const { appName, defaultUseragent } = require("../electron/config");
const settings = require("./settings");

const userAgent = settings.get("user_agent") || defaultUseragent;

const _session = session.fromPartition(`persist:${appName}`);
_session.setUserAgent(userAgent);

settings.on("change", "user_agent", newUserAgent => {
  newUserAgent = newUserAgent || defaultUseragent;
  _session.setUserAgent(newUserAgent);
});

module.exports = _session;
