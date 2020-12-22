const { defaultStorageData } = require("../electron/config");
const storage = require("electron-json-storage");
const events = require("events");

const eventEmitter = new events.EventEmitter();

let settings = {};

let saveToStorageTimeout = null;

/**
 * Get stored settings
 * @param key
 * @param defaultValue
 * @returns {boolean|*}
 */
const get = (key, defaultValue) => {
  if (settings[key] !== undefined) return settings[key];

  if (defaultValue !== undefined) return defaultValue;

  return false;
};

/**
 * Set setting and store to db
 * @param key
 * @param newValue
 */
const set = (key, newValue) => {
  const oldValue = get(key);

  settings[key] = newValue;

  clearTimeout(saveToStorageTimeout);

  saveToStorageTimeout = setTimeout(() => {
    storage.set("configs", settings);
  }, 500);

  if (oldValue !== newValue) eventEmitter.emit("change" + key, newValue);
};

const on = (eventName, key, callback) => {
  eventEmitter.on(eventName + key, callback);
};

const init = () => {
  return new Promise(resolve => {
    storage.get("configs", (error, data) => {
      if (error) resolve(error);

      for (const configKey in defaultStorageData)
        if (!data[configKey]) data[configKey] = defaultStorageData[configKey];

      settings = data;
      set("inits", get("inits", 0) + 1);
      resolve(true);
    });
  });
};

module.exports = {
  init,
  get,
  set,
  on,
};
