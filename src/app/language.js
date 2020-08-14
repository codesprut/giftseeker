const { websiteUrl } = require("../electron/config");
const storage = require("electron-json-storage");
const axios = require("axios");
const settings = require("./settings");
const fs = require("fs");

let languages = {};

const downloadTranslation = async name => {
  return axios.get(`${websiteUrl}trans/${name}`).then(res => {
    fs.writeFile(
      storage.getDataPath() + "/" + name,
      JSON.stringify(res.data),
      err => {
        console.error("Translation download failed", err);
      },
    );
  });
};

const updateTranslations = async () => {
  const translations = await axios
    .get(`${websiteUrl}api/langs_new`)
    .then(res => JSON.parse(res.data.response).langs)
    .catch(() => false);

  if (!translations) return;

  for (const translation of translations) {
    const { name, size } = translation;

    if (!fs.existsSync(storage.getDataPath() + "/" + name)) {
      await downloadTranslation(name);
      continue;
    }

    await new Promise(resolve => {
      fs.stat(storage.getDataPath() + "/" + name, async (err, stats) => {
        if (!err && stats.size !== size) await downloadTranslation(name);

        resolve();
      });
    });
  }
};

const loadTranslations = async () => {
  const languagesList = [];
  const storageFiles = fs.readdirSync(storage.getDataPath());

  for (const filename of storageFiles) {
    if (filename.indexOf("lang.") >= 0) {
      languagesList.push(filename.replace(".json", ""));
    }
  }

  if (!languagesList.length)
    throw new Error(`No translations found on storage`);

  return await new Promise((resolve, reject) => {
    storage.getMany(languagesList, (error, loadedFiles) => {
      if (error) reject(new Error(`Can't load selected translation`));
      resolve(loadedFiles.lang);
    });
  });
};

const init = async () => {
  if (!fs.existsSync(storage.getDataPath()))
    throw new Error(`Could not find storage directory`);

  await updateTranslations();
  languages = await loadTranslations();

  let selectedLanguage = current();

  if (!languages[selectedLanguage]) {
    selectedLanguage = Object.keys(languages)[0];
    settings.set("language", selectedLanguage);
  }
};

/**
 *
 * @param key of translation string
 * @returns {string}
 */
const get = key => {
  let response = languages;
  const keysTree = `${current()}.${key}`.split(".");

  for (const treeLevel of keysTree) {
    if (response[treeLevel] === undefined) return key;

    response = response[treeLevel];
  }

  return response;
};

const change = setLang => {
  if (!languages[setLang]) return;

  settings.set("language", setLang);
};

/**
 *
 * @returns {string} current translation
 */
const current = () => {
  return settings.get("language");
};

/**
 * Program translation quantity
 * @returns {number}
 */
const quantity = () => {
  return Object.keys(languages).length;
};

const listAvailable = () => {
  const list = [];
  for (const language of Object.keys(languages)) {
    const { culture, name } = languages[language].lang;
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
