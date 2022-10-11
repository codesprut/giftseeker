const ENV = require("../environment");
const config = require("./config");
const AutoLaunch = require("auto-launch");

const autoStart = new AutoLaunch({ name: config.appName });

const isEnabled = () => autoStart.isEnabled();

const set = enabled => {
  if (enabled && !ENV.devMode) {
    return autoStart.enable();
  }

  autoStart.disable();
};

module.exports = { set, isEnabled };
