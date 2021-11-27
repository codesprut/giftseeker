const baseSettings = require("./base-settings");

module.exports = (settingsName, service) =>
  baseSettings(settingsName, service, () => {});
