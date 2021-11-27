const baseSettings = require("./base-settings");
const dataType = require("./data-type.enum");

function isInt(n) {
  return Number(n) === n && n % 1 === 0;
}

function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}

module.exports = requiredType => {
  // eslint-disable-next-line no-unused-vars
  const validator = input =>
    requiredType === dataType.INT ? isInt(input) : isFloat(input);

  return (settingName, service) =>
    baseSettings(settingName, service, () => {
      // todo: use validator
    });
};
