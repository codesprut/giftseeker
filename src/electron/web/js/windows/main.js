import language from "../language.js";

const axios = require("axios").default;
const path = require("path");

const { remote, ipcRenderer } = require("electron");

const accountData = remote.getGlobal("user");
const {
  settings,
  config,
  Browser,
  authWindow,
  mainWindow,
  autoUpdater,
  isPortable,
  currentBuild,
} = remote.getGlobal("sharedData");

const updateIcon = document.querySelector("div.update-available");
const logoutButton = document.querySelector(".logout-button");

let intervalTicks = 0;
let updateAvailable = false;

const intervalActions = async () => {
  if (intervalTicks % 300 === 0 && !isPortable && !updateAvailable)
    autoUpdater.checkForUpdatesAndNotify();

  if (intervalTicks !== 0 && intervalTicks % 300 === 0) {
    axios
      .get(`${config.websiteUrl}api/userData?ver=${currentBuild}`)
      .then(({ data }) => {
        if (data.response) renderUser(data.response);
        else switchToAuthWindow();
      });
  }

  intervalTicks++;
};

const reloadLangStrings = () => {
  document
    .querySelectorAll("[data-lang],[data-lang-title],[data-tippy-translate]")
    .forEach(language.updateNode);
};

const settingsSection = () => {
  document.querySelector(".build .version").innerText = currentBuild;

  const languageSelect = document.querySelector("select#lang");

  if (language.quantity() > 1) {
    for (const lang of language.listAvailable()) {
      const option = document.createElement("option");
      option.setAttribute("id", lang.culture);
      option.value = lang.culture;
      option.innerText = `[${lang.culture}] ${lang.name}`;

      if (language.current() === lang.culture) option.selected = true;

      languageSelect.append(option);
    }
  } else languageSelect.remove();

  const infoLinks = document.querySelector(".content-item .info-links");

  const websiteLink = document.createElement("button");
  websiteLink.classList.add("open-website");
  websiteLink.dataset.link = config.websiteUrl;
  websiteLink.innerText = "GiftSeeker.RU";

  const steamLink = document.createElement("button");
  steamLink.classList.add("open-website");
  steamLink.dataset.link = "https://steamcommunity.com/groups/GiftSeeker";
  steamLink.dataset.lang = "settings.steam_group";
  steamLink.style.marginLeft = "7px";

  const donationLink = document.createElement("button");
  donationLink.classList.add("open-website");
  donationLink.dataset.link = `${config.websiteUrl}donation`;
  donationLink.dataset.lang = "settings.donation";
  donationLink.style.marginLeft = "7px";

  infoLinks.appendChild(websiteLink);
  infoLinks.appendChild(steamLink);
  infoLinks.appendChild(donationLink);
};

const renderUser = accountData => {
  document.querySelector(
    "#head .user-bar .avatar",
  ).style.backgroundImage = `url("${accountData.avatar}")`;
  document.querySelector("#head .user-bar .username").innerText =
    accountData.username;
};

const switchToAuthWindow = () => {
  mainWindow.hide();
  mainWindow.loadURL(path.resolve(__dirname, "/blank.html"));

  ipcRenderer.send("save-user", null);
  authWindow.show();
};

window.minimizeWindow = () => {
  remote.BrowserWindow.getFocusedWindow().hide();
};

window.closeWindow = () => {
  if (settings.get("minimize_on_close")) {
    window.minimizeWindow();
    return;
  }

  window.close();
};

(() => {
  autoUpdater.on("update-available", () => {
    updateAvailable = true;
    updateIcon.classList.add("progress");
  });

  autoUpdater.on("download-progress", (progress, speed, percent) => {
    updateIcon.setAttribute(
      "title",
      `${language.get("ui.upd_progress")} - ${percent}%`,
    );
  });

  autoUpdater.on("update-downloaded", () => {
    updateIcon.classList.add("downloaded");
    updateIcon.setAttribute("title", language.get("ui.upd_downloaded"));
  });

  setInterval(intervalActions, 1000);

  renderUser(accountData);
  settingsSection();
  reloadLangStrings();

  document
    .querySelectorAll("[data-menu-id=settings] .setter")
    .forEach(control => {
      switch (control.getAttribute("type")) {
        case "checkbox":
          control.checked = settings.get(control.getAttribute("id"));
          break;
      }

      control.onchange = () => {
        if (control.getAttribute("id") === "lang") {
          ipcRenderer.send("change-lang", control.value);
          return;
        }

        if (control.getAttribute("type") === "checkbox")
          settings.set(control.getAttribute("id"), control.checked);
      };
    });

  const preventWindowMinimize = authWindow.isVisible();

  authWindow.hide();
  mainWindow.show();

  let windowHeight = window.offsetHeight;
  const expanderHeight = 40;
  const userAgentArea = document.querySelector("textarea#useragent");
  const servicesSwitcher = document.querySelector(".services_switcher");
  const servicesIcons = document.querySelector(".services-icons");

  userAgentArea.placeholder = config.storage.defaultData.user_agent;
  userAgentArea.value = Browser.webContents.session.getUserAgent();
  userAgentArea.onchange = () =>
    settings.set(
      "user_agent",
      userAgentArea.value || userAgentArea.placeholder,
    );

  if (settings.get("wide_services_switcher"))
    servicesSwitcher.classList.add("wide");

  document.querySelector(
    ".services_switcher .expander .span-wrap",
  ).onclick = () => {
    servicesSwitcher.style.transition = "width 0.3s";
    servicesSwitcher.classList.toggle("wide");

    const wideSwitcher = servicesSwitcher.classList.contains("wide");

    settings.set("wide_services_switcher", wideSwitcher);
  };

  const servicesSwitcherScroll = scrollStep => {
    let scrollTop = parseInt(servicesIcons.style.top || 0);
    const iconsHeight = servicesIcons.offsetHeight;
    const switcherHeight = servicesSwitcher.offsetHeight;
    const minScroll = switcherHeight - iconsHeight - expanderHeight;

    scrollTop += scrollStep;

    if (scrollTop < minScroll) scrollTop = minScroll;
    if (scrollTop > 0) scrollTop = 0;

    servicesIcons.style.top = `${scrollTop}px`;
  };

  window.onresize = () => {
    const newHeight = window.innerHeight;
    const difference = newHeight - windowHeight || 0;

    if (difference > 0) servicesSwitcherScroll(difference);

    windowHeight = window.innerHeight;
  };

  servicesSwitcher.onmousewheel = ev =>
    servicesSwitcherScroll(ev.wheelDelta > 0 ? 20 : -20);

  if (settings.get("start_minimized") && !preventWindowMinimize) {
    mainWindow.hide();
  } else mainWindow.focus();

  document.querySelectorAll(".menu li").forEach(menuItem => {
    menuItem.onclick = () => {
      document
        .querySelectorAll(".menu li, .content-item")
        .forEach(node => node.classList.remove("active"));

      document
        .querySelectorAll(`[data-menu-id=${menuItem.dataset.menuId}]`)
        .forEach(node => node.classList.add("active"));
    };
  });

  logoutButton.onclick = () => {
    logoutButton.classList.add("disabled");
    axios
      .get(`${config.websiteUrl}logout`)
      .then(switchToAuthWindow)
      .catch(() => alert("something went wrong..."))
      .finally(() => logoutButton.classList.remove("disabled"));
  };

  ipcRenderer.on("change-lang", () => reloadLangStrings());
})();
