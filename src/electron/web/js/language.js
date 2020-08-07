const tippy = require("tippy.js").default;
const language = require("electron").remote.getGlobal("sharedData").language;

language.updateNode = node => {
  if (node.dataset.lang) {
    node.innerHTML = language.get(node.dataset.lang);
  }
  if (node.dataset.langTitle) {
    node.setAttribute("title", language.get(node.dataset.langTitle));
  }
  if (node.dataset.tippyTranslate) {
    const languageKey = node.dataset.tippyTranslate;
    const translation = language.get(languageKey);

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

export default language;
