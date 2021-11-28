const translation = require("../../../../modules/translation");
const baseCommand = require("../../base-command");

const getCommand = (settingName, description, service) =>
  baseCommand(`${service.name}:${settingName}:get`, description, () =>
    console.info(service.getConfig(settingName)),
  );

const setCommand = (settingName, description, service, action) =>
  baseCommand(`${service.name}:${settingName}:set`, description, action);

module.exports = (settingsName, service, setAction) => {
  const setting = translation
    .get(service.settings[settingsName].trans)
    .toLowerCase();

  const getDescription = translation.get("cli.services.setting-get", setting);
  const setDescription = translation.get("cli.services.setting-set", setting);

  return [
    getCommand(settingsName, getDescription, service),
    setCommand(settingsName, setDescription, service, setAction),
  ];
};
