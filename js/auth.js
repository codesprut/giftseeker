"use strict";

const remote = require("electron").remote;
const ipc = require("electron").ipcRenderer;
const shared = remote.getGlobal("sharedData");

let Lang = shared.Lang;
let mainWindow = shared.mainWindow;
let Browser = shared.Browser;

let status = $(".status-text");
let buttons = $("#auth_button");
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

  let lang_select = $("select#lang");
  let lang_list = Lang.list();

  // Наполняем языковой селект, либо удаляем его
  if (Lang.count() <= 1) {
    lang_select.remove();
    $(".no-available-langs")
      .css("display", "block")
      .next()
      .css("display", "none");
  } else {
    for (let lang in lang_list) {
      let option = $(document.createElement("option"))
        .attr("id", lang_list[lang].lang_culture)
        .val(lang)
        .text(
          "[" + lang_list[lang].lang_culture + "] " + lang_list[lang].lang_name
        );

      if (Lang.current() === lang) option.prop("selected", true);

      lang_select.append(option);
    }

    lang_select.change(function() {
      ipc.send("change-lang", $(this).val());
    });
  }

  $("#auth_button").click(function(e) {
    e.preventDefault();

    Browser.loadURL("https://giftseeker.ru/logIn");
    Browser.show();
    Browser.setTitle("GS Browser - " + Lang.get("auth.browser_loading"));

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
  status.text(Lang.get("auth.check"));

  $.ajax({
    url: "https://giftseeker.ru/api/userData",
    data: { ver: currentBuild },
    dataType: "json",
    success: function(data) {
      if (!data.response) {
        status.text(Lang.get("auth.ses_not_found"));
        buttons.removeClass("disabled");
        return;
      }

      ipc.send("save-user", data.response);

      status.text(Lang.get("auth.session") + data.response.username);

      loadProgram();
    },
    error: () => {
      status.text(Lang.get("auth.connection_error"));
      buttons.removeClass("disabled");
    }
  });
}

function loadProgram() {
  mainWindow.loadFile("index.html");
}

function reloadLangStrings() {
  $("[data-lang]").each(function() {
    $(this).html(Lang.get($(this).attr("data-lang")));
  });

  $("[data-lang-title]").each(function() {
    $(this).attr("title", Lang.get($(this).attr("data-lang-title")));
  });
}
