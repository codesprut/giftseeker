const config = require("./config");
const storage = require("electron-json-storage");
const events = require("events");

storage.setDataPath(config.storagePath);

storage.get("configs", (error, data) => {
  if (error) throw error;

  settings = data;
  set("inits", get("inits", 0) + 1);
});

const eventEmitter = new events.EventEmitter();

let settings = {};

const get = (key, defaultValue) => {
  if (settings[key] !== undefined) return settings[key];

  if (defaultValue !== undefined) return defaultValue;

  return false;
};

const set = (key, newValue) => {
  const oldValue = get(key);

  settings[key] = newValue;

  storage.set("configs", settings);

  if (oldValue !== newValue) eventEmitter.emit("change", key, newValue);
};

const on = (eventName, callback) => {
  eventEmitter.on(eventName, callback);
};

module.exports = {
  get,
  set,
  on
};
