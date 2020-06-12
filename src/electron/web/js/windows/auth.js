"use strict";
window.$ = window.jQuery = require("jquery");
const { remote, ipcRenderer } = require("electron");

const {
  language,
  config,
  mainWindow,
  Browser,
  ipcMain,
  currentBuild
} = remote.getGlobal("sharedData");

const status = $(".status-text");
const buttons = $("#auth_button");

function onShow() {
  reloadLangStrings();
  buttons.removeClass("disabled");
}

$(function() {
  ipcMain.on("change-lang", function() {
    reloadLangStrings();
  });
  ipcMain.on("window-shown", function() {
    buttons.removeClass("disabled");
  });

  const languageSelect = $("select#lang");
  const languagesList = language.listAvailable();

  // Наполняем языковой селект, либо удаляем его
  if (language.count() <= 1) {
    languageSelect.remove();
    $(".no-available-langs")
      .css("display", "block")
      .next()
      .css("display", "none");
  } else {
    for (const lang of languagesList) {
      const option = $(document.createElement("option"))
        .attr("id", lang.culture)
        .val(lang.culture)
        .text("[" + lang.culture + "] " + lang.name);

      if (language.current() === lang.culture) option.prop("selected", true);

      languageSelect.append(option);
    }

    languageSelect.change(function() {
      ipcRenderer.send("change-lang", $(this).val());
    });
  }

  $("#auth_button").click(function(e) {
    e.preventDefault();

    Browser.loadURL(`${config.websiteUrl}logIn`);
    Browser.show();
    Browser.setTitle("GS Browser - " + language.get("auth.browser_loading"));

    Browser.webContents.on("did-finish-load", () => {
      if (Browser.getURL() === config.websiteUrl) {
        Browser.webContents
          .executeJavaScript('document.querySelector("body").innerHTML')
          .then(body => {
            if (body.indexOf("/account") >= 0) {
              Browser.webContents.removeAllListeners("did-finish-load");
              Browser.close();
              checkAuth();
            }
          });
      }
    });
  });

  checkAuth();
});

function checkAuth() {
  buttons.addClass("disabled");
  status.text(language.get("auth.check"));

  $.ajax({
    url: `${config.websiteUrl}api/userData`,
    data: { ver: currentBuild },
    dataType: "json",
    success: function(data) {
      if (!data.response) {
        status.text(language.get("auth.ses_not_found"));
        buttons.removeClass("disabled");
        return;
      }

      ipcRenderer.send("save-user", data.response);

      status.text(language.get("auth.session") + data.response.username);

      loadProgram();
    },
    error: () => {
      status.text(language.get("auth.connection_error"));
      buttons.removeClass("disabled");
    }
  });
}

function loadProgram() {
  mainWindow.loadFile("./src/electron/web/main.html");
}

function reloadLangStrings() {
  $("[data-lang]").each(function() {
    $(this).html(language.get($(this).attr("data-lang")));
  });

  $("[data-lang-title]").each(function() {
    $(this).attr("title", language.get($(this).attr("data-lang-title")));
  });
}
