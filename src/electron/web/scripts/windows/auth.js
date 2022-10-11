const { ipcRenderer } = require("electron");
import browser from "../browser.js";
import {
  updatePagePhrases,
  getTranslation,
  initTranslationSelector,
} from "../language.js";

const statusLabel = document.querySelector(".status-text");
const authButton = document.querySelector("#auth_button");

const setAuthStatus = (phraseKey, suffix) => {
  statusLabel.innerHTML =
    `<span data-lang="${phraseKey}">${getTranslation(phraseKey)}</span>` +
    (suffix ?? "");
};

const setLogoutState = () => {
  authButton.classList.remove("disabled");
  setAuthStatus("auth.ses_not_found");
};

ipcRenderer.send("window-loaded", "auth-window");

ipcRenderer.on("window-initial-data", async (event, data) => {
  const { websiteUrl, translations } = data;

  updatePagePhrases(translations.phrases);
  initTranslationSelector(translations);

  authButton.classList.add("disabled");
  setAuthStatus("auth.check");

  authButton.onclick = async () => {
    authButton.classList.add("disabled");
    setAuthStatus("auth.check");

    await browser.authorizationWindow(
      websiteUrl,
      `${websiteUrl}logIn`,
      "/account",
    );

    ipcRenderer.send("authorization-window-closed");
  };
});

ipcRenderer.on("authorization-check-result", (event, authCheckResult) => {
  if (authCheckResult.loggedIn) {
    setAuthStatus("auth.session", authCheckResult.userData.username);
    return;
  } else if (authCheckResult.error) {
    setAuthStatus("auth.connection_error");
  } else {
    setAuthStatus("auth.ses_not_found");
  }

  authButton.classList.remove("disabled");
});

ipcRenderer.on("translation-changed", async (event, translations) => {
  updatePagePhrases(translations.phrases);
});

export { setLogoutState };
