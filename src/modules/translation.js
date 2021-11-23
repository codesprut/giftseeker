const storage = require("./json-storage");
const settings = require("./settings");
const https = require("https");
const axios = require("axios");
const fs = require("fs");

const settingsKey = "translation";
const axiosConfig = {
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
};

let translations = {};

const downloadTranslation = async name => {
  return axios.get(`/trans/${name}`, axiosConfig).then(({ data }) => {
    return new Promise(resolve => {
      fs.writeFile(
        storage.getDataPath() + "/" + name,
        JSON.stringify(data),
        resolve,
      );
    });
  });
};

const updateTranslations = async () => {
  const translations = await axios
    .get(`/api/langs_new`, axiosConfig)
    .then(res => JSON.parse(res.data.response).langs)
    .catch(() => false);

  if (!translations) return;

  for (const translation of translations) {
    const { name, cleanSize } = translation;

    if (!fs.existsSync(storage.getDataPath() + "/" + name)) {
      await downloadTranslation(name);
      continue;
    }

    await new Promise(resolve => {
      fs.stat(storage.getDataPath() + "/" + name, async (err, stats) => {
        if (!err && stats.size !== cleanSize) await downloadTranslation(name);

        resolve();
      });
    });
  }
};

const loadTranslations = async () => {
  const translationsList = [];
  const storageFiles = await storage.filesList();

  for (const filename of storageFiles) {
    if (filename.indexOf("lang.") >= 0) {
      translationsList.push(filename.replace(".json", ""));
    }
  }

  if (!translationsList.length)
    throw new Error(`No translations found on storage`);

  const loadedTranslations = await storage.loadMany(translationsList);

  return Object.fromEntries(
    loadedTranslations.map(translation => [
      translation.lang.culture,
      translation,
    ]),
  );
};

const init = async downloadHost => {
  if (!fs.existsSync(storage.getDataPath()))
    throw new Error(`Could not find storage directory`);

  axiosConfig.baseUrl = downloadHost;

  await updateTranslations(downloadHost);
  translations = await loadTranslations();

  let selectedTranslation = current();

  if (!translations[selectedTranslation]) {
    selectedTranslation = Object.keys(translations)[0];
    settings.set(settingsKey, selectedTranslation);
  }
};

/**
 *
 * @param key of translation string
 * @returns {string}
 */
const get = key => {
  let response = translations;
  const keysTree = `${current()}.${key}`.split(".");

  for (const treeLevel of keysTree) {
    if (response[treeLevel] === undefined) return key;

    response = response[treeLevel];
  }

  return response;
};

const change = newTranslation => {
  if (!translations[newTranslation]) return;

  settings.set(settingsKey, newTranslation);
};

/**
 *
 * @returns {string} current translation
 */
const current = () => {
  return settings.get(settingsKey);
};

/**
 * Program translation quantity
 * @returns {number}
 */
const quantity = () => {
  return Object.keys(translations).length;
};

const listAvailable = () => {
  const list = [];
  for (const translation of Object.keys(translations)) {
    const { culture, name } = translations[translation].lang;
    list.push({ culture, name });
  }

  return list;
};

module.exports = {
  quantity,
  current,
  change,
  init,
  get,
  listAvailable,
};
