const storage = require("./json-storage");
const events = require("events");
const fs = require("fs");

const eventEmitter = new events.EventEmitter();
const storageFilename = "settings";

let settings = {};
let saveToStorageTimeout = null;

/**
 * Get stored settings
 * @param key
 * @param defaultValue
 * @returns {any}
 */
const get = (key, defaultValue) => {
  if (settings[key] !== undefined) {
    return settings[key];
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

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

  if (oldValue !== newValue) {
    eventEmitter.emit("change" + key, newValue);
  }
};

const on = (eventName, key, callback) => {
  eventEmitter.on(eventName + key, callback);
};

const init = async defaultSettings => {
  if (!fs.existsSync(storage.getDataPath())) {
    throw new Error(`Could not find storage directory`);
  }

  settings = await storage.loadFile(storageFilename).catch(() => ({}));

  for (const configKey in defaultSettings) {
    if (!settings[configKey]) {
      settings[configKey] = defaultSettings[configKey];
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
