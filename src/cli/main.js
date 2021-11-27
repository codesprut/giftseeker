const Settings = require("../modules/settings");

const translation = require("../modules/translation");
const storage = require("../modules/json-storage");
const config = require("../config");
const session = require("./session");

const commands = require("./commands");

storage.setDataPath(config.storageDataPath);

(async () => {
  const settings = await Settings.build("cli", config.defaultSettings);

  translation.init(settings, config.websiteUrl).then(async () => {
    await session.init(settings);

    if (!session.current()) {
      console.log(translation.get("cli.session-not-found"));
      await commands.sessionCreate();
    }

    commands.listen();
  });
})();
