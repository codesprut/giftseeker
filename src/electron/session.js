const { session } = require("electron");

const { appName } = require("./config");
const settings = require("../app/settings");

const create = () => {
  const _session = session.fromPartition(`persist:${appName}`);
  _session.setUserAgent(settings.get("user_agent"));

  settings.on("change", "user_agent", newUserAgent => {
    _session.setUserAgent(newUserAgent);
  });

  return _session;
};

module.exports = { create };
