const { remote, ipcRenderer } = require("electron");
const axios = require("axios").default;

const {
  language,
  config,
  mainWindow,
  ipcMain,
  currentBuild
} = remote.getGlobal("sharedData");

import browser from "../browser.js";

const statusLabel = document.querySelector(".status-text");
const authButton = document.querySelector("#auth_button");
const languageSelect = document.querySelector("select#lang");

ipcMain.on("change-lang", () => reloadLangStrings());
ipcMain.on("window-shown", function() {
  authButton.classList.remove("disabled");
});

if (language.quantity() > 1) {
  for (const lang of language.listAvailable()) {
    const option = document.createElement("option");
    option.setAttribute("id", lang.culture);
    option.value = lang.culture;
    option.innerText = `[${lang.culture}] ${lang.name}`;

    if (language.current() === lang.culture) option.selected = true;

    languageSelect.appendChild(option);
  }

  languageSelect.onclick = () => {
    ipcRenderer.send("change-lang", languageSelect.value);
  };
} else {
  languageSelect.remove();
  document.querySelector(".no-translations-available").style.display = "block";
  document.querySelector(".choose-lang-label").style.display = "none";
}

authButton.onclick = async () => {
  authButton.classList.add("disabled");

  await browser.runForAuth(
    config.websiteUrl,
    `${config.websiteUrl}logIn`,
    "/account"
  );

  attemptAuthorize();
};

const wrapTranslation = key =>
  `<span data-lang="${key}">${language.get(key)}</span>`;

const loadProgram = () => mainWindow.loadFile("./src/electron/web/main.html");

const attemptAuthorize = () => {
  authButton.classList.add("disabled");
  statusLabel.innerHTML = wrapTranslation("auth.check");
  axios
    .get(`${config.websiteUrl}api/userData`, {
      data: `ver=${currentBuild}`
    })
    .then(({ data }) => {
      if (data.response) {
        ipcRenderer.send("save-user", data.response);
        statusLabel.innerHTML =
          wrapTranslation("auth.session") + data.response.username;
        loadProgram();
        return;
      }
      statusLabel.innerHTML = wrapTranslation("auth.ses_not_found");
    })
    .catch(() => {
      statusLabel.innerHTML = wrapTranslation("auth.connection_error");
    })
    .finally(() => {
      authButton.classList.remove("disabled");
    });
};

const reloadLangStrings = () => {
  document
    .querySelectorAll("[data-lang]")
    .forEach(el => (el.innerHTML = language.get(el.dataset.lang)));
  document
    .querySelectorAll("[data-lang-title]")
    .forEach(el =>
      el.setAttribute("title", language.get(el.dataset.langTitle))
    );
};

(async () => {
  reloadLangStrings();
  attemptAuthorize();
})();
