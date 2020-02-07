"use strict";

class Seeker {
  constructor() {
    this.totalTicks = 0;

    this.usrUpdTimer = 60;

    this.started = false;
    this.reconnectTimeout = null;

    this.cookies = "";
    this.domain = "giftseeker.ru";
    this.websiteUrl = "https://giftseeker.ru";
    this.authLink = "https://giftseeker.ru";
    this.wonsUrl = "https://giftseeker.ru";
    this.authContent = null;

    this.withValue = true;
    this.curr_value = 0;

    this.getTimeout = 15000;
    this.settings = {
      timer: {
        type: "number",
        trans: "service.timer",
        min: 5,
        max: 60,
        default: this.getConfig("timer", 10)
      },
      interval_from: {
        type: "number",
        trans: "service.interval_from",
        min: 0,
        max: this.getConfig("interval_to", 5),
        default: this.getConfig("interval_from", 3)
      },
      interval_to: {
        type: "number",
        trans: "service.interval_to",
        min: this.getConfig("interval_from", 3),
        max: 60,
        default: this.getConfig("interval_to", 5)
      },
      pages: {
        type: "number",
        trans: "service.pages",
        min: 1,
        max: 10,
        default: this.getConfig("pages", 1)
      }
    };
  }

  init() {
    this.addIcon();
    this.addPanel();
    this.renderSettings();

    this.updateCookies();

    this.serviceSchedule();

    if (settings.get("autostart")) this.startSeeker(true);
  }

  addIcon() {
    this.icon = $(document.createElement("div"))
      .addClass("service-icon")
      .appendTo(".services-icons");

    $(document.createElement("div"))
      .addClass("bg")
      .css({
        "background-image":
          "url('images/services/" + this.constructor.name + ".png')"
      })
      .appendTo(this.icon);

    this.statusIcon = $(document.createElement("div"))
      .addClass("service-status")
      .attr("data-status", "normal")
      .html(
        '<span class="fa fa-play"></span>' + '<span class="fa fa-pause"></span>'
      )
      .appendTo(this.icon);

    $(document.createElement("span"))
      .addClass("service-name")
      .text(this.constructor.name)
      .appendTo(this.icon);

    this.icon.on("click", () => {
      this.setActive();
    });
  }

  addPanel() {
    this.panel = $(document.createElement("div"))
      .addClass("service-panel")
      .attr("id", this.constructor.name.toLowerCase())
      .appendTo(".services-panels");

    $(
      "<ul>" +
        '<li class="active" data-id="logs" data-lang="service.logs">' +
        language.get("service.logs") +
        "</li>" +
        '<li data-id="settings" data-lang="service.settings">' +
        language.get("service.settings") +
        "</li>" +
        "</ul>"
    ).appendTo(this.panel);

    this.logWrap = $(document.createElement("div"))
      .addClass("service-logs in-service-panel styled-scrollbar active")
      .attr("data-id", "logs")
      .appendTo(this.panel);

    this.logField = $(document.createElement("div")).appendTo(this.logWrap);

    $(document.createElement("span"))
      .addClass("clear-log")
      .text(language.get("service.clear_log"))
      .attr("data-lang", "service.clear_log")
      .click(() => {
        this.clearLog();
      })
      .appendTo(this.logWrap);

    this.settingsPanel = $(document.createElement("div"))
      .addClass("service-settings in-service-panel")
      .attr("data-id", "settings")
      .appendTo(this.panel);

    this.settingsNums = $(document.createElement("div"))
      .addClass("settings-numbers")
      .appendTo(this.settingsPanel);

    this.settingsChecks = $(document.createElement("div"))
      .addClass("settings-checkbox")
      .appendTo(this.settingsPanel);

    this.userPanel = $(document.createElement("div"))
      .addClass("service-user-panel")
      .appendTo(this.panel);

    this.userInfo = $(document.createElement("div"))
      .addClass("user-info no-selectable")
      .html('<div class="avatar"></div>' + '<span class="username"></span>')
      .appendTo(this.userPanel);

    if (this.withValue) {
      let value = $(document.createElement("span"))
        .addClass("value")
        .html(
          '<span data-lang="' +
            this.transPath("value_label") +
            '">' +
            this.trans("value_label") +
            "</span>: "
        )
        .appendTo(this.userInfo);

      this.value_label = $(document.createElement("span"))
        .text(this.curr_value)
        .appendTo(value);
    }

    $(document.createElement("button"))
      .addClass("open-website")
      .attr("data-lang", "service.open_website")
      .text(language.get("service.open_website"))
      .attr("data-link", this.websiteUrl)
      .appendTo(this.userPanel);

    this.mainButton = $(
      "<button>" + language.get("service.btn_start") + "</button>"
    )
      .addClass("seeker-button start-button")
      .hover(
        () => {
          this.mainButton.addClass("hovered");
          if (this.started) this.buttonState(language.get("service.btn_stop"));
        },
        () => {
          this.mainButton.removeClass("hovered");
          if (this.started)
            this.buttonState(
              window.timeToStr(
                this.entryInterval() - (this.totalTicks % this.entryInterval())
              )
            );
        }
      )
      .click(() => {
        if (this.mainButton.hasClass("disabled")) return;

        if (!this.started) this.startSeeker();
        else this.stopSeeker();
      })
      .appendTo(this.userPanel);
  }

  setActive() {
    $(".service-icon, .service-panel").removeClass("active");

    this.icon.addClass("active");
    this.panel.addClass("active");
  }

  authCheck(callback) {
    $.ajax({
      url: this.websiteUrl,
      timeout: this.getTimeout,
      success: html => {
        callback(html.indexOf(this.authContent) >= 0 ? 1 : 0);
      },
      error: () => {
        callback(-1);
      }
    });
  }

  startSeeker(autostart) {
    if (this.started) return false;

    this.buttonState(language.get("service.btn_checking"), "disabled");

    this.authCheck(authState => {
      if (authState === 1) {
        this.setStateStarted();
      } else if (authState === -1) {
        this.log(language.get("service.connection_error"), true);
        this.buttonState(language.get("service.btn_start"));

        if (autostart) {
          this.setStatus("bad");
          this.runReconnectTimeout();
        }
      } else {
        if (autostart) {
          this.setStatus("bad");
          this.buttonState(language.get("service.btn_start"));
          this.log(language.get("service.cant_start"), true);
        } else {
          this.buttonState(language.get("service.btn_awaiting"), "disabled");
          this.runBrowserForAuth();
        }
      }
    });
  }

  stopSeeker(withError, reconnect) {
    const status = withError ? "bad" : "normal";
    if (!this.started) return false;

    this.started = false;
    this.setStatus(status);

    this.log(language.get("service.stopped"));
    this.buttonState(language.get("service.btn_start"));

    if (reconnect) this.runReconnectTimeout();
  }

  runReconnectTimeout() {
    this.log(language.get("service.reconnect_in_5_min"));
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.startSeeker(true);
    }, 300000);
  }

  setStateStarted() {
    this.totalTicks = 0;
    this.started = true;

    this.setStatus("good");
    this.log(language.get("service.started"));

    this.updateUserInfo();
  }

  serviceSchedule() {
    setInterval(() => {
      if (this.totalTicks !== 0 && this.totalTicks % this.usrUpdTimer === 0)
        this.updateUserInfo();

      if (this.started) {
        if (this.totalTicks % this.entryInterval() === 0) {
          this.authCheck(authState => {
            if (authState === 1) {
              this.updateCookies();
              this.seekService();
            } else if (authState === 0) {
              this.log(language.get("service.session_expired"), true);
              this.stopSeeker(true);
            } else {
              this.log(language.get("service.connection_lost"), true);
              this.stopSeeker(true, true);
            }
          });
        }

        if (!this.mainButton.hasClass("hovered"))
          this.buttonState(
            window.timeToStr(
              this.entryInterval() - (this.totalTicks % this.entryInterval())
            )
          );
      }

      this.totalTicks = this.totalTicks < 32760 ? this.totalTicks + 1 : 0;
    }, 1000);
  }

  updateUserInfo() {
    this.authCheck(authState => {
      if (authState === 1) {
        this.getUserInfo(userData => {
          this.userInfo
            .find(".avatar")
            .css("background-image", "url('" + userData.avatar + "')");
          this.userInfo.find(".username").text(userData.username);

          if (this.withValue) this.setValue(userData.value);

          this.userInfo.addClass("visible");
        });
      }
    });
  }

  runBrowserForAuth() {
    let awaitAuth = true;

    Browser.webContents.on("did-finish-load", () => {
      if (awaitAuth && Browser.getURL().indexOf(this.websiteUrl) >= 0) {
        Browser.webContents
          .executeJavaScript('document.querySelector("body").innerHTML')
          .then(body => {
            if (body.indexOf(this.authContent) >= 0) {
              Browser.close();
              awaitAuth = false;
            }
          });
      }
    });

    Browser.setTitle("GS Browser - " + language.get("auth.browser_loading"));
    Browser.loadURL(this.authLink);

    Browser.once("close", () => {
      Browser.webContents.removeAllListeners("did-finish-load");

      awaitAuth = false;
      this.authCheck(authState => {
        if (authState === 1) this.setStateStarted();
        else this.buttonState(language.get("service.btn_start"));
      });
    });
    Browser.show();
  }

  renderSettings() {
    for (const control in this.settings) {
      if (!this.settings.hasOwnProperty(control)) continue;

      const input = this.settings[control];

      switch (input.type) {
        case "number":
        case "float_number":
          let step = input.type === "number" ? 1 : 0.1;

          if (input.default < input.min) {
            input.default = input.min;
            this.setConfig(control, input.default);
          } else if (input.default > input.max) {
            input.default = input.max;
            this.setConfig(control, input.default);
          }

          let numberWrap = $(document.createElement("div"))
            .addClass("input-wrap number no-selectable")
            .attr(
              "data-control",
              this.constructor.name.toLowerCase() + "." + control
            )
            .appendTo(this.settingsNums);

          numberWrap.html(
            '<div class="button btn-down"><span class="fa fa-minus"></span></div>' +
              '<div class="value-label">' +
              input.default +
              "</div>" +
              '<div class="button btn-up"><span class="fa fa-plus"></span></div>' +
              '<div class="label" title="' +
              language.get(input.trans + "_title") +
              '" data-lang-title="' +
              input.trans +
              '_title" data-lang="' +
              input.trans +
              '">' +
              language.get(input.trans) +
              "</div>"
          );

          let _this = this;
          let vLabel = numberWrap.find(".value-label");
          let btnUp = numberWrap.find(".btn-up");
          let btnDn = numberWrap.find(".btn-down");

          if (input.default === input.max) btnUp.addClass("disabled");
          if (input.default === input.min) btnDn.addClass("disabled");

          let pressTimeout = undefined;
          let iterations = 0;

          let up = function() {
            let val = parseFloat(vLabel.text());
            if (val < input.max) {
              val = val + step;
              btnDn.removeClass("disabled");
            }

            if (input.type === "float_number") val = parseFloat(val.toFixed(1));

            if (val === input.max) btnUp.addClass("disabled");

            vLabel.text(val);
            _this.setConfig(control, val);

            switch (control) {
              case "min_cost":
                _this.settings.max_cost.min = val;
                _this.reinitNumber("max_cost");
                break;
              case "max_cost":
                _this.settings.min_cost.max = val;
                _this.reinitNumber("min_cost");
                break;
              case "interval_from":
                _this.settings.interval_to.min = val;
                _this.reinitNumber("interval_to");
                break;
              case "interval_to":
                _this.settings.interval_from.max = val;
                _this.reinitNumber("interval_from");
                break;
            }
          };

          let dn = function() {
            let val = parseFloat(vLabel.text());
            if (val > input.min) {
              val = val - step;
              btnUp.removeClass("disabled");
            }

            if (input.type === "float_number") val = parseFloat(val.toFixed(1));

            if (val === input.min) btnDn.addClass("disabled");

            vLabel.text(val);
            _this.setConfig(control, val);

            switch (control) {
              case "min_cost":
                _this.settings.max_cost.min = val;
                _this.reinitNumber("max_cost");
                break;
              case "max_cost":
                _this.settings.min_cost.max = val;
                _this.reinitNumber("min_cost");
                break;
              case "interval_from":
                _this.settings.interval_to.min = val;
                _this.reinitNumber("interval_to");
                break;
              case "interval_to":
                _this.settings.interval_from.max = val;
                _this.reinitNumber("interval_from");
                break;
            }
          };

          btnUp
            .on("mousedown", () => {
              let func = function() {
                iterations++;
                up();

                pressTimeout = setTimeout(func, 200 / (iterations / 2));
              };
              func();
            })
            .on("mouseup mouseleave", () => {
              iterations = 0;
              clearTimeout(pressTimeout);
            });

          btnDn
            .on("mousedown", () => {
              let func = function() {
                iterations++;
                dn();

                pressTimeout = setTimeout(func, 200 / (iterations / 2));
              };
              func();
            })
            .on("mouseup mouseleave", () => {
              iterations = 0;
              clearTimeout(pressTimeout);
            });

          break;
        case "checkbox":
          let checkboxWrap = $(document.createElement("div"))
            .addClass("input-wrap checkbox no-selectable")
            .appendTo(this.settingsChecks);

          checkboxWrap.html(
            '<label title="' +
              input.trans +
              "_title" +
              '" data-lang-title="' +
              input.trans +
              '_title">' +
              '<input type="checkbox"/>' +
              '<span data-lang="' +
              input.trans +
              '">' +
              language.get(input.trans) +
              "</span>" +
              "</label>"
          );

          let checkbox = checkboxWrap
            .find("input")
            .prop("checked", input.default);

          checkbox.change(() => {
            this.setConfig(control, checkbox.prop("checked"));
          });

          break;
      }
    }
  }

  reinitNumber(control) {
    let wrap = $(
        '[data-control="' +
          this.constructor.name.toLowerCase() +
          "." +
          control +
          '"]'
      ),
      val = parseInt(wrap.find(".value-label").text());

    wrap.find(".button").removeClass("disabled");

    if (val <= this.settings[control].min)
      wrap.find(".btn-down").addClass("disabled");

    if (val >= this.settings[control].max)
      wrap.find(".btn-up").addClass("disabled");
  }

  logLink(address, anchor) {
    return (
      '<span class="open-website" data-link="' +
      address +
      '">' +
      anchor +
      "</span>"
    );
  }

  updateCookies() {
    Browser.webContents.session.cookies
      .get({ domain: this.domain })
      .then(cookies => {
        this.cookies = cookies
          .map(cookie => cookie.name + "=" + cookie.value)
          .join("; ");
      });
  }

  interval() {
    const min = this.getConfig(
      "interval_from",
      this.settings.interval_from.default
    );
    const max =
      this.getConfig("interval_to", this.settings.interval_to.default) + 1;

    return (Math.floor(Math.random() * (max - min)) + min) * 1000;
  }

  entryInterval() {
    return this.getConfig("timer", 10) * 60;
  }

  setStatus(status) {
    this.statusIcon.attr("data-status", status);
  }

  buttonState(text, className) {
    this.mainButton.removeClass("disabled").text(text);
    if (className) this.mainButton.addClass(className);
  }

  setValue(new_value) {
    if (this.withValue) {
      this.value_label.text(new_value);
      this.curr_value = parseInt(new_value);
    }
  }

  getConfig(key, def) {
    if (def === undefined) def = this.settings[key].default;

    return settings.get(this.constructor.name.toLowerCase() + "_" + key, def);
  }

  setConfig(key, val) {
    return settings.set(this.constructor.name.toLowerCase() + "_" + key, val);
  }

  transPath(key) {
    return "service." + this.constructor.name.toLowerCase() + "." + key;
  }

  trans(key) {
    return language.get(
      "service." + this.constructor.name.toLowerCase() + "." + key
    );
  }

  clearLog() {
    this.logField.html(
      '<div><span class="time">' +
        timeStr() +
        ":</span>" +
        language.get("service.log_cleared") +
        "</div>"
    );
  }

  log(text, logType) {
    this.logField.append(
      '<div class="' +
        (logType ? "warn" : "normal") +
        '"><span class="time">' +
        timeStr() +
        ":</span>" +
        text +
        "</div>"
    );
    this.logWrap.scrollTop(this.logWrap[0].scrollHeight);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ### "Виртуальные методы" - реализуются в потомках
  // Основной метод
  seekService() {}

  // Получение данных о юзере - аватар, имя, валюта
  getUserInfo(callback) {
    callback({
      avatar: "https://giftseeker.ru/favicon.ico",
      username: "GS User",
      value: 0
    });
  }
}
