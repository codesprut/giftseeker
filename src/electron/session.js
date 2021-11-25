const { session } = require("electron");

const create = (settings, sessionName) => {
  const _session = session.fromPartition(`persist:${sessionName}`);
  _session.setUserAgent(settings.get("user_agent"));

  settings.on("change", "user_agent", newUserAgent => {
    _session.setUserAgent(newUserAgent);
  });

  return _session;
};

module.exports = { create };
