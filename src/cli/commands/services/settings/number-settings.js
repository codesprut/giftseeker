const baseSettings = require("./base-settings");
const dataTypeValidator = require("./data-type-validator");
const inquirer = require("inquirer");

module.exports = (settingName, service) => {
  const setting = service.settings[settingName];

  const validate = input => {
    const newValue = Number(input);
    const validator = dataTypeValidator[setting.type];

    if (!validator.validate(newValue)) {
      return validator.message;
    }
    if (newValue < setting.min) {
      return `Cannot enter value lesser than ${setting.min}`;
    }
    if (newValue > setting.max) {
      return `Cannot enter value greater than ${setting.min}`;
    }

    return true;
  };

  return baseSettings(settingName, service, () => {
    return inquirer
      .prompt([
        {
          type: "input",
          name: "input",
          prefix: "",
          suffix: ":",
          message: `Enter new ${settingName} value`,
          validate,
        },
      ])
      .then(async ({ input }) => service.setConfig(settingName, Number(input)));
  });
};
