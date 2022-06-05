const settingType = require("../../../../core/services/settings/setting-type.enum");

module.exports = {
  [settingType.INTEGER]: {
    validate: num => Number(num) === num && num % 1 === 0,
    message: "Please enter valid integer Number",
  },
  [settingType.FLOAT]: {
    validate: num => !isNaN(num),
    message: "Please enter valid Number",
  },
};
