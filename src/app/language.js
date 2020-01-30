const storage = require("electron-json-storage");
const request = require("request-promise-native");
const config = require("./config");
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

const updatedTranslations = async () => {
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

const init = async () => {
  if (!fs.existsSync(storage.getDataPath()))
    throw new Error(`Could not find storage directory`);

  await updatedTranslations();

  const languagesList = [];
  const storageFiles = fs.readdirSync(storage.getDataPath());

  for (const filename of storageFiles) {
    if (filename.indexOf("lang.") >= 0) {
      languagesList.push(filename.replace(".json", ""));
    }
  }

  if (!languagesList.length)
    throw new Error(`No downloaded translations found`);

  storage.getMany(languagesList, function(error, loadedFiles) {
    if (error) throw new Error(`Can't load selected translation`);

    let selectedLanguage = config.defaultLanguage;

    if (loadedFiles.lang[current()] === undefined)
      selectedLanguage = loadedFiles[0];

    settings.set("lang", selectedLanguage);

    languages = loadedFiles.lang;
  });
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
  return languages;
};

module.exports = {
  count,
  current,
  change,
  init,
  get,
  listAvailable
};
