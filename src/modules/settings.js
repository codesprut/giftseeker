const storage = require("./json-storage");
const events = require("events");
const fs = require("fs");

const storageWriteDelayMs = 1000;

class Settings {
  constructor(storageFilename, initialSettings) {
    this.settings = initialSettings;
    this.storageFilename = storageFilename;

    this.eventEmitter = new events.EventEmitter();
    this.saveToStorageTimeout = null;
  }

  static async build(filenamePrefix = "settings", defaultSettings = {}) {
    if (!fs.existsSync(storage.getDataPath())) {
      throw new Error(`Could not find storage directory`);
    }

    const storageFilename = `${filenamePrefix}.settings`;

    const storedSettings = await storage
      .loadFile(storageFilename)
      .catch(() => ({}));

    for (const configKey in defaultSettings) {
      if (!storedSettings[configKey]) {
        storedSettings[configKey] = defaultSettings[configKey];
      }
    }

    const settingsInstance = new Settings(storageFilename, storedSettings);

    settingsInstance.set("inits", settingsInstance.get("inits", 0) + 1);

    return settingsInstance;
  }

  /**
   * Set setting and store to db
   * @param key
   * @param newValue
   */
  set(key, newValue) {
    const oldValue = this.get(key);

    this.settings[key] = newValue;

    clearTimeout(this.saveToStorageTimeout);

    this.saveToStorageTimeout = setTimeout(() => {
      storage.saveFile(this.storageFilename, this.settings);
    }, storageWriteDelayMs);

    if (oldValue !== newValue) {
      this.eventEmitter.emit("change" + key, newValue);
    }
  }

  /**
   * Get stored settings
   * @param key
   * @param defaultValue
   * @returns {any}
   */
  get(key, defaultValue) {
    if (this.settings[key] !== undefined) {
      return this.settings[key];
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return false;
  }

  on(eventName, key, callback) {
    this.eventEmitter.on(eventName + key, callback);
  }
}

module.exports = Settings;
