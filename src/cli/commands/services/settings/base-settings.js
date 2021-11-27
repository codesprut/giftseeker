const translation = require("../../../../modules/translation");
const baseCommand = require("../../base-command");

const getCommand = (settingName, description, service) =>
  baseCommand(`${service.name}:${settingName}:get`, description, () =>
    console.info(service.getConfig(settingName)),
  );

const setCommand = (settingName, description, service, action) =>
  baseCommand(`${service.name}:${settingName}:set`, description, action);

module.exports = (settingsName, service, setAction) => {
  const description = translation
    .get(service.settings[settingsName].trans)
    .toLowerCase();

  return [
    getCommand(settingsName, `Get ${description} setting`, service),
    setCommand(settingsName, `Set ${description} setting`, service, setAction),
  ];
};
