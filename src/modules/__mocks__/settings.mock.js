jest.mock("../settings.js");
const settings = require("../settings");

let currentSettings = {};

settings.set.mockImplementation((key, val) => (currentSettings[key] = val));

settings.get.mockImplementation((key, defaultValue) => {
  if (currentSettings[key] !== undefined) return currentSettings[key];
  if (defaultValue !== undefined) return defaultValue;

  return false;
});

settings.setup = data => (currentSettings = data);

module.exports = settings;