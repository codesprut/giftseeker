const { appRoot } = require("../environment");
const coreConfig = require("../config");

module.exports = {
  ...coreConfig,
  appIcon: appRoot + "/resources/images/icon.ico",
  window: {
    width: {
      default: 750,
      min: 650,
      max: 1200,
    },
    height: {
      default: 500,
      min: 400,
      max: 900,
    },
  },
};
