const ENV = require("./environment");

module.exports = {
  appName: "GiftSeeker",
  websiteUrl: "https://giftseeker.ru/",
  storagePath: ENV.execPath + "data",
  defaultLanguage: "ru_RU",
  appIcon: __dirname + "/src/resources/images/icon.ico"
};
