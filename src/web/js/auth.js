"use strict";

const remote = require("electron").remote;
const ipc = require("electron").ipcRenderer;
const shared = remote.getGlobal("sharedData");

const language = shared.language;
const mainWindow = shared.mainWindow;
const Browser = shared.Browser;

const status = $(".status-text");
const buttons = $("#auth_button");
//let buttons = $('#content .seeker-button');

function onShow() {
  reloadLangStrings();
  buttons.removeClass("disabled");
}

$(function() {
  shared.ipcMain.on("change-lang", function() {
    reloadLangStrings();
  });
  shared.ipcMain.on("window-shown", function() {
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

      languageSelect.append(option);
    }

    languageSelect.change(function() {
      ipc.send("change-lang", $(this).val());
    });
  }

  $("#auth_button").click(function(e) {
    e.preventDefault();

    Browser.loadURL("https://giftseeker.ru/logIn");
    Browser.show();
    Browser.setTitle("GS Browser - " + language.get("auth.browser_loading"));

    Browser.webContents.on("did-finish-load", () => {
      if (Browser.getURL() === "https://giftseeker.ru/") {
        Browser.webContents.executeJavaScript(
          'document.querySelector("body").innerHTML',
          body => {
            if (body.indexOf("/account") >= 0) {
              Browser.webContents.removeAllListeners("did-finish-load");
              Browser.close();
              checkAuth();
            }
          }
        );
      }
    });
  });

  checkAuth();
});

function checkAuth() {
  buttons.addClass("disabled");
  status.text(language.get("auth.check"));

  $.ajax({
    url: "https://giftseeker.ru/api/userData",
    data: { ver: currentBuild },
    dataType: "json",
    success: function(data) {
      if (!data.response) {
        status.text(language.get("auth.ses_not_found"));
        buttons.removeClass("disabled");
        return;
      }

      ipc.send("save-user", data.response);

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
  mainWindow.loadFile("./src/web/index.html");
}

function reloadLangStrings() {
  $("[data-lang]").each(function() {
    $(this).html(language.get($(this).attr("data-lang")));
  });

  $("[data-lang-title]").each(function() {
    $(this).attr("title", language.get($(this).attr("data-lang-title")));
  });
}
