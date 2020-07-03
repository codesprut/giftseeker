const { session } = require("electron");

const { appName } = require("../electron/config");
const settings = require("./settings");

const _session = session.fromPartition(`persist:${appName}`);
_session.setUserAgent(settings.get("user_agent"));

settings.on("change", "user_agent", newUserAgent => {
  _session.setUserAgent(newUserAgent);
});

module.exports = _session;
