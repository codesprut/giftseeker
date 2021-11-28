const translation = require("../../../../modules/translation");
const baseCommand = require("../../base-command");

const getCommand = (settingName, description, service) =>
  baseCommand(`${service.name}:${settingName}:get`, description, () =>
    console.info(service.getConfig(settingName)),
  );

const setCommand = (settingName, description, service, action) =>
  baseCommand(`${service.name}:${settingName}:set`, description, action);

const getSettingDescription = (settingName, service) => {
  if (!service.settings[settingName]) {
    return settingName;
  }

  return translation.get(service.settings[settingName].trans).toLowerCase();
};

module.exports = (settingName, service, setAction) => {
  const description = getSettingDescription(settingName, service);

  const getDesc = translation.get("cli.services.setting-get", description);
  const setDesc = translation.get("cli.services.setting-set", description);

  return [
    getCommand(settingName, getDesc, service),
    setCommand(settingName, setDesc, service, setAction),
  ];
};
