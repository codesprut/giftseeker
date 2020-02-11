const ENV = require("./environment");

const appName = "GiftSeeker";
const installableStorage = ENV.homedir + "/" + appName;
const portableStorage = ENV.execPath + "data";

const storagePath = ENV.isPortable ? portableStorage : installableStorage;

module.exports = {
  appName: appName,
  websiteUrl: "https://giftseeker.ru/",
  storagePath: storagePath,
  oldStoragePath: portableStorage,
  defaultLanguage: "ru_RU",
  appIcon: __dirname + "/../resources/images/icon.ico",
  window: {
    defaultWidth: 750,
    minWidth: 650,
    maxWidth: 1200,
    defaultHeight: 500,
    minHeight: 400,
    maxHeight: 900
  },
  defaultUseragent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.88 Mobile/15E148 Safari/605.1"
};
