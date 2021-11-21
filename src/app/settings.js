const { storage: storageConfig } = require("../electron/config");
const events = require("events");
const storage = require("./json-storage");

const eventEmitter = new events.EventEmitter();
const storageFilename = "settings";

let settings = {};
let saveToStorageTimeout = null;

storage.setDataPath(storageConfig.dataPath);

/**
 * Get stored settings
 * @param key
 * @param defaultValue
 * @returns {any}
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
    storage.saveFile(storageFilename, settings);
  }, 500);

  if (oldValue !== newValue) eventEmitter.emit("change" + key, newValue);
};

const on = (eventName, key, callback) => {
  eventEmitter.on(eventName + key, callback);
};

const init = async () => {
  settings = await storage.loadFile(storageFilename).catch(() => ({}));

  for (const configKey in storageConfig.defaultData) {
    if (!settings[configKey]) {
      settings[configKey] = storageConfig.defaultData[configKey];
    }
  }

  set("inits", get("inits", 0) + 1);
};

module.exports = {
  init,
  get,
  set,
  on,
};
