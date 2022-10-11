const { ipcRenderer } = require("electron");

const tippy = require("tippy.js").default;

let _phrases = {};

/**
 *
 * @param phraseKey of translation string
 * @param replacers for substitute values into message
 * @returns {string}
 */
const getTranslation = (phraseKey, ...replacers) => {
  const keysTree = `${phraseKey}`.split(".");

  const phrase = keysTree.reduce(
    (searchLevel, key) => (searchLevel ? searchLevel[key] : undefined),
    _phrases,
  );

  if (!phrase) {
    return phraseKey;
  }

  return replacers.reduce(
    (message, value, index) => message.replace(`{${index}}`, value),
    phrase,
  );
};

const updateNode = node => {
  if (node.dataset.lang) {
    node.innerHTML = getTranslation(node.dataset.lang);
  }
  if (node.dataset.langTitle) {
    node.setAttribute("title", getTranslation(node.dataset.langTitle));
  }
  if (node.dataset.tippyTranslate) {
    const languageKey = node.dataset.tippyTranslate;
    const translation = getTranslation(languageKey);

    if (!node._tippy) {
      node.dataset.tippyContent = translation;
      tippy(node, {
        placement: "bottom-end",
        arrow: true,
      });
      return;
    }

    node._tippy.setContent(translation);
  }
};

const updatePagePhrases = phrases => {
  _phrases = phrases;

  document
    .querySelectorAll("[data-lang],[data-lang-title],[data-tippy-translate]")
    .forEach(updateNode);
};

const initTranslationSelector = ({ list, current }) => {
  const selectorNode = document.querySelector("select#lang");

  if (list.length <= 1) {
    selectorNode.remove();
    document.querySelector(".no-translations-available").style.display =
      "block";
    document.querySelector(".choose-lang-label").style.display = "none";
    return;
  }

  for (const lang of list) {
    const option = document.createElement("option");
    option.setAttribute("id", lang.culture);
    option.value = lang.culture;
    option.innerText = `[${lang.culture}] ${lang.name}`;

    if (current === lang.culture) {
      option.selected = true;
    }

    selectorNode.appendChild(option);
  }

  selectorNode.onchange = () => {
    ipcRenderer.send("translation-changed", selectorNode.value);
  };
};

export { updatePagePhrases, getTranslation, initTranslationSelector };
