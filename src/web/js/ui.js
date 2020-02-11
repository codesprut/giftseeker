"use strict";

window.$ = window.jQuery = require("jquery");
const tippy = require("tippy.js").default;

const { remote, ipcRenderer, shell } = require("electron");
const accountData = remote.getGlobal("user");
const {
  Request,
  language,
  settings,
  config,
  Browser,
  authWindow,
  mainWindow,
  autoUpdater,
  isPortable
} = remote.getGlobal("sharedData");

const updateIcon = $("div.update-available");
let intervalTicks = 0,
  updateAvail = false;

const tippyOptions = {
  placement: "bottom-end",
  arrow: true
};

$(() => {
  tippy("[data-tippy-content]", tippyOptions);

  autoUpdater.on("update-available", () => {
    updateAvail = true;
    updateIcon.addClass("progress");
  });

  autoUpdater.on("download-progress", (progress, speed, percent) => {
    updateIcon.attr(
      "title",
      language.get("ui.upd_progress") + " - " + percent + "%"
    );
  });

  autoUpdater.on("update-downloaded", () => {
    updateIcon
      .addClass("downloaded")
      .attr("title", language.get("ui.upd_downloaded"));
  });

  // Основной воркер главного окна
  setInterval(intervalSchedules, 1000);

  // UI LOAD
  reloadLangStrings();
  settingsSection();

  const setters = $("[data-id=settings] .setter").each(function() {
    let item = $(this);

    switch (item.attr("type")) {
      case "checkbox":
        item.prop("checked", settings.get(item.attr("id")));
        break;
    }
  });

  authWindow.hide();
  mainWindow.show();

  let windowHeight = window.offsetHeight;
  const expanderHeight = 40;
  const userAgentArea = document.querySelector("textarea#useragent");
  const servicesSwitcher = document.querySelector(".services_switcher");
  const servicesIcons = document.querySelector(".services-icons");

  userAgentArea.placeholder = config.defaultUseragent;
  userAgentArea.value = Browser.webContents.session.getUserAgent();
  userAgentArea.onchange = () =>
    settings.set("user_agent", userAgentArea.value);

  if (settings.get("wide_services_switcher"))
    servicesSwitcher.classList.add("wide");

  document.querySelector(
    ".services_switcher .expander .span-wrap"
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

  if (settings.get("start_minimized")) mainWindow.hide();
  else mainWindow.focus();

  // Переключение основных пунктов меню
  $(".menu li span").click(function() {
    let parent = $(this).parent();
    $(".menu li, .content-item").removeClass("active");

    parent
      .add('.content-item[data-id="' + parent.attr("data-id") + '"]')
      .addClass("active");
  });

  // Переключение вкладок внутри сервиса - переключаем сразу во всех сервисах
  $(document).on("click", ".service-panel > ul li", function() {
    $(".service-panel > ul li, .in-service-panel").removeClass("active");
    $('.in-service-panel[data-id="' + $(this).attr("data-id") + '"]')
      .add('.service-panel > ul li[data-id="' + $(this).attr("data-id") + '"]')
      .addClass("active");
  });

  $(".logout-button").click(function() {
    let clicked = $(this).addClass("disabled");

    $.ajax({
      method: "get",
      url: `${config.websiteUrl}logout`,
      success: function() {
        mainWindow.hide();
        mainWindow.loadURL(__dirname + "/blank.html");

        ipcRenderer.send("save-user", null);
        authWindow.show();
      },
      error: function() {
        clicked.removeClass("disabled");
        alert("something went wrong...");
      }
    });
  });

  // Изменение настроек
  setters.change(function() {
    const changed = $(this);
    let value = changed.val();

    if (changed.attr("type") === "checkbox") {
      value = changed.prop("checked");
    }

    if (changed.attr("id") === "lang") {
      ipcRenderer.send("change-lang", value);
      return;
    }

    settings.set(changed.attr("id"), value);
  });

  ipcRenderer.on("change-lang", function() {
    reloadLangStrings();
  });

  $(".open-website[data-link]").click(e => openWebsite(e.target.dataset.link));
});

function intervalSchedules() {
  if (intervalTicks % 300 === 0 && !isPortable && !updateAvail)
    autoUpdater.checkForUpdatesAndNotify();

  // user info update
  if (intervalTicks !== 0 && intervalTicks % 300 === 0) {
    $.ajax({
      url: `${config.websiteUrl}api/userData`,
      data: { ver: currentBuild },
      dataType: "json",
      success: data => {
        if (data.response) renderUser(data.response);
      }
    });
  }

  intervalTicks++;
}

function reloadLangStrings() {
  $("[data-lang]").each(function() {
    $(this).html(language.get($(this).attr("data-lang")));
  });

  $("[data-lang-title]").each(function() {
    $(this).attr("title", language.get($(this).attr("data-lang-title")));
  });

  $("[data-tippy-translate]").each((i, element) => {
    const languageKey = element.dataset.tippyTranslate;
    const translation = language.get(languageKey);

    if (!element._tippy) {
      element.dataset.tippyContent = translation;
      tippy(element, tippyOptions);
      return;
    }

    element._tippy.setContent(translation);
  });
}

function settingsSection() {
  renderUser(accountData);

  $(".build .version").text(currentBuild);

  const languageSwitch = $("select#lang");
  const languagesList = language.listAvailable();

  // fill language select
  if (language.count() <= 1) languageSwitch.remove();
  else {
    for (let lang in languagesList) {
      let option = $(document.createElement("option"))
        .attr("id", languagesList[lang].lang_culture)
        .val(lang)
        .text(
          "[" +
            languagesList[lang].lang_culture +
            "] " +
            languagesList[lang].lang_name
        );

      if (language.current() === lang) option.prop("selected", true);

      languageSwitch.append(option);
    }
  }

  // settings bottom links
  const infoLinks = $(".content-item .info-links");

  $(document.createElement("button"))
    .addClass("open-website")
    .text("GiftSeeker.RU")
    .attr("data-link", config.websiteUrl)
    .appendTo(infoLinks);

  $(document.createElement("button"))
    .addClass("open-website")
    .attr("data-lang", "settings.steam_group")
    .text(language.get("settings.steam_group"))
    .css("margin-left", "7px")
    .attr("data-link", "https://steamcommunity.com/groups/GiftSeeker")
    .appendTo(infoLinks);

  $(document.createElement("button"))
    .addClass("open-website")
    .attr("data-lang", "settings.donation")
    .text(language.get("settings.donation"))
    .css("margin-left", "7px")
    .attr("data-link", `${config.websiteUrl}donation`)
    .appendTo(infoLinks);
}

function renderUser(accountData) {
  $("#head .user-bar .avatar").css({
    "background-image": 'url("' + accountData.avatar + '")'
  });
  $("#head .user-bar .username").html(accountData.username);
}

const openWebsite = url => {
  if (settings.get("use_system_browser")) return shell.openExternal(url);

  Browser.loadURL(url);
  Browser.setTitle("GS Browser - " + language.get("auth.browser_loading"));

  Browser.show();
};

const minimizeWindow = () => {
  remote.BrowserWindow.getFocusedWindow().hide();
};

const closeWindow = () => {
  if (settings.get("minimize_on_close")) {
    minimizeWindow();
    return;
  }

  window.close();
};
