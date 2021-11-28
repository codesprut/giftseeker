const storage = require("./json-storage");
const https = require("https");
const axios = require("axios");
const fs = require("fs");

const settingsKey = "translation";
const axiosConfig = {
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
};

let settings;
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

  if (!translations) {
    return;
  }

  for (const translation of translations) {
    const { name, cleanSize } = translation;

    if (!fs.existsSync(storage.getDataPath() + "/" + name)) {
      await downloadTranslation(name);
      continue;
    }

    await new Promise(resolve => {
      fs.stat(storage.getDataPath() + "/" + name, async (err, stats) => {
        if (!err && stats.size !== cleanSize) {
          await downloadTranslation(name);
        }

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

  if (!translationsList.length) {
    throw new Error(`No translations found on storage`);
  }

  const loadedTranslations = await storage.loadMany(translationsList);

  return Object.fromEntries(
    loadedTranslations.map(translation => [
      translation.lang.culture,
      translation,
    ]),
  );
};

const init = async (settingsInstance, downloadHost) => {
  settings = settingsInstance;
  axiosConfig.baseURL = downloadHost;

  await updateTranslations();
  translations = await loadTranslations();

  let selectedTranslation = current();

  if (!translations[selectedTranslation]) {
    selectedTranslation = Object.keys(translations)[0];
    settings.set(settingsKey, selectedTranslation);
  }
};

/**
 *
 * @param translationKey of translation string
 * @param replacers for substitute values into message
 * @returns {string}
 */
const get = (translationKey, ...replacers) => {
  const keysTree = `${current()}.${translationKey}`.split(".");

  const translation = keysTree.reduce(
    (searchLevel, key) => (searchLevel ? searchLevel[key] : undefined),
    translations,
  );

  if (!translation) {
    return translationKey;
  }

  return replacers.reduce(
    (message, value, index) => message.replace(`{${index}}`, value),
    translation,
  );
};

const change = newTranslation => {
  if (!translations[newTranslation]) {
    return;
  }

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
