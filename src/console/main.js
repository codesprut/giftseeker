const Settings = require("../modules/settings");

const translation = require("../modules/translation");
const storage = require("../modules/json-storage");
const config = require("../config");
const sessions = require("./sessions");

const cli = require("./cli");

storage.setDataPath(config.storageDataPath);

(async () => {
  const settings = await Settings.build("cli", config.defaultSettings);

  translation.init(settings, config.websiteUrl).then(async () => {
    await sessions.init(settings);

    if (!sessions.current()) {
      console.log(translation.get("cli.session-not-found"));
      await cli.sessionCreate();
    }

    cli.listen();
  });
})();
