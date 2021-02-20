const ENV = require("../environment");

const appName = "GiftSeeker";
const installableStorage = ENV.homedir + "/" + appName;
const portableStorage = ENV.execPath + "data";

const storageDataPath = ENV.isPortable ? portableStorage : installableStorage;

module.exports = {
  appName,
  websiteUrl: "https://giftseeker.ru/",
  appIcon: ENV.appRoot + "/resources/images/icon.ico",
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
  storage: {
    dataPath: storageDataPath,
    defaultData: {
      language: "en_US",
      user_agent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.88 Mobile/15E148 Safari/604.1",
    },
  },
};
