const storage = require("./json-storage");
const https = require("https");
const axios = require("axios");

const settingsKey = "translation";
const axiosConfig = {
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
};

let settings;
let translations = {};

const downloadTranslation = async filename => {
  return axios
    .get(`/trans/${filename}`, axiosConfig)
    .then(({ data }) => storage.saveFile(filename, data));
};

const updateTranslations = async () => {
  const translations = await axios
    .get(`/api/translations`, axiosConfig)
    .then(res => res.data.translations)
    .catch(() => false);

  if (!translations) {
    return;
  }

  return Promise.allSettled(translations.map(it => updateTranslation(it)));
};

const updateTranslation = async translation => {
  const { name, contentLength } = translation;

  if (!storage.filesExists(name)) {
    return downloadTranslation(name);
  }

  const fileContent = await storage.loadFile(name);
  const localContentLength = JSON.stringify(fileContent).length;

  if (localContentLength !== contentLength) {
    return downloadTranslation(name);
  }
};

const loadTranslations = async () => {
  const translationsList = [];
  const storageFiles = await storage.filesList();

  for (const filename of storageFiles) {
    if (filename.indexOf("locale.") >= 0) {
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
 * @returns {string} current translation name
 */
const current = () => {
  return settings.get(settingsKey);
};

/**
 *
 * @returns {Object} current translation phrases tree
 */
const currentPhrases = () => {
  return translations[current()];
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
  get,
  init,
  change,
  current,
  listAvailable,
  currentPhrases,
};
