const translationFiles = require("../resources/translations");

const settingsKey = "translation";

let settings;
let translations = Object.fromEntries(
  translationFiles.map(file => [file.lang.culture, file]),
);

const init = async settingsInstance => {
  settings = settingsInstance;

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
