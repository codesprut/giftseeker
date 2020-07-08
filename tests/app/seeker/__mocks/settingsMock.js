jest.mock("electron", () => ({
  get app() {
    return {};
  }
}));

jest.mock("../../../../src/app/settings.js");
const settings = require("../../../../src/app/settings");

let currentSettings = {};

settings.set.mockImplementation((key, val) => (currentSettings[key] = val));

settings.get.mockImplementation((key, val) => {
  if (currentSettings[key] !== undefined) return val;
  return false;
});

settings.setup = data => Object.assign(currentSettings, data);

module.exports = settings;
