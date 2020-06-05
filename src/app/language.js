const storage = require("electron-json-storage");
const request = require("./request-promise");
const config = require("../electron/config");
const settings = require("./settings");
const fs = require("fs");

let languages = {};

const downloadTranslation = async name => {
  await request({ uri: `${config.websiteUrl}trans/${name}` }).then(
    translationStrings => {
      fs.writeFile(
        storage.getDataPath() + "/" + name,
        translationStrings,
        err => {}
      );
    }
  );
};

const updateTranslations = async () => {
  const { response } = await request({
    uri: `${config.websiteUrl}api/langs_new`,
    json: true
  });

  if (!response || response.length === 0) return;

  const translations = JSON.parse(response).langs;

  for (const translation of translations) {
    const { name, size } = translation;

    if (!fs.existsSync(storage.getDataPath() + "/" + name)) {
      await downloadTranslation(name);
      continue;
    }

    await new Promise(resolve => {
      fs.stat(storage.getDataPath() + "/" + name, async (err, stats) => {
        if (stats.size !== size) await downloadTranslation(name);

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

  if (!languages[selectedLanguage])
    selectedLanguage = Object.keys(loadedFiles.lang)[0];

  settings.set("lang", selectedLanguage);
};

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

  settings.set("lang", setLang);
  // TODO: emit event
};

const current = () => {
  return settings.get("lang", config.defaultLanguage);
};

const count = () => {
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
  count,
  current,
  change,
  init,
  get,
  listAvailable
};
