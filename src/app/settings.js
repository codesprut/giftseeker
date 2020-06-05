const config = require("../electron/config");
const storage = require("electron-json-storage");
const events = require("events");
const fs = require("fs");

const eventEmitter = new events.EventEmitter();

let settings = {};

let saveToStorageTimeout = null;

const get = (key, defaultValue) => {
  if (settings[key] !== undefined) return settings[key];

  if (defaultValue !== undefined) return defaultValue;

  return false;
};

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

const storageMigration = async () => {
  const oldPath = config.oldStoragePath + "/configs.json";
  const newPath = config.storagePath + "/configs.json";
  const oldExists = await new Promise(re => re(fs.existsSync(oldPath)));
  const newExists = await new Promise(re => re(fs.existsSync(newPath)));

  if (!oldExists || newExists) return;

  await new Promise(re => re(fs.copyFileSync(oldPath, newPath)));
};

const init = () => {
  return new Promise(async resolve => {
    await storageMigration();

    storage.setDataPath(config.storagePath);

    storage.get("configs", (error, data) => {
      if (error) resolve(error);

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
  on
};
