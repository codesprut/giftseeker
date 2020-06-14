const settings = require("../settings");
const language = require("../language");
const statuses = require("./statuses");
const axios = require("axios");

module.exports = class Seeker {
  totalTicks = 0;
  currentValue = 0;
  updateUserInterval = 60;

  reconnectTimeout = null;
  status = statuses.PAUSED;

  constructor(params) {
    this.name = this.constructor.name;

    this.withValue = params.withValue || true;

    this.domain = params.domain;
    this.websiteUrl = params.websiteUrl;
    this.authPageUrl = params.authPageUrl;
    this.winsPageUrl = params.winsPageUrl;
    this.authContent = params.authContent;

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

    this.http = axios.create({
      timeout: params.requestTimeout || 5000,
      responseType: "text",
      withCredentials: true,
      headers: {
        "User-Agent": settings.get("user_agent"),
        Cookie: this.getConfig("cookie")
      }
    });

    this.serviceWorker();

    // if (settings.get("autostart")) this.startSeeker(true);
  }

  async authCheck() {
    return this.http
      .get(this.websiteUrl)
      .then(res => (res.data.indexOf(this.authContent) >= 0 ? 1 : 0))
      .catch(err => (err.status === 200 ? 0 : -1));
  }

  setCookie(cookie) {
    this.setConfig("cookie", cookie);
    this.http.defaults.headers.common["Cookie"] = cookie;
  }

  start(autostart) {
    if (this.isStarted()) return false;

    // this.authCheck(authState => {
    //   if (authState === 1) {
    //     this.setStateStarted();
    //   } else if (authState === -1) {
    //     this.log(language.get("service.connection_error"), true);
    //
    //     if (autostart) {
    //       this.setStatus(statuses.ERROR);
    //       this.runReconnectTimeout();
    //     }
    //   } else {
    //     if (autostart) {
    //       this.setStatus(statuses.ERROR);
    //       this.log(language.get("service.cant_start"), true);
    //     }
    //     // else {
    //     //   this.runBrowserForAuth();
    //     // }
    //   }
    // });
  }

  stopSeeker(withError, reconnect) {
    const status = withError ? statuses.ERROR : statuses.PAUSED;
    if (!this.isStarted()) return false;

    this.setStatus(status);

    this.log(language.get("service.stopped"));

    if (reconnect) this.runReconnectTimeout();
  }

  runReconnectTimeout() {
    this.log(language.get("service.reconnect_in_5_min"));
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.start(true);
    }, 300000);
  }

  setStateStarted() {
    this.totalTicks = 0;

    this.setStatus(statuses.STARTED);
    this.log(language.get("service.started"));

    // this.updateUserInfo();
  }

  serviceWorker() {
    setInterval(() => {
      if (this.totalTicks !== 0 && this.totalTicks % this.usrUpdTimer === 0)
        this.updateUserInfo();

      if (this.isStarted()) {
        if (this.totalTicks % this.entryInterval() === 0) {
          this.authCheck(authState => {
            if (authState === 1) {
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
      }

      this.totalTicks = this.totalTicks < 32760 ? this.totalTicks + 1 : 0;
    }, 1000);
  }

  updateUserInfo() {
    // this.authCheck(authState => {
    //   if (authState === 1) {
    //     this.getUserInfo(userData => {
    //       this.userInfo
    //         .find(".avatar")
    //         .css("background-image", "url('" + userData.avatar + "')");
    //       this.userInfo.find(".username").text(userData.username);
    //
    //       if (this.withValue) this.setValue(userData.value);
    //
    //       this.userInfo.addClass("visible");
    //     });
    //   }
    // });
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
    this.status = status;
  }

  isStarted() {
    return this.status === statuses.STARTED;
  }

  setValue(new_value) {
    if (!this.withValue) return;
    this.curr_value = parseInt(new_value);
  }

  getConfig(key, def) {
    if (def === undefined && this.settings[key])
      def = this.settings[key].default;

    return settings.get(this.name.toLowerCase() + "_" + key, def);
  }

  setConfig(key, val) {
    return settings.set(this.name.toLowerCase() + "_" + key, val);
  }

  translationKey(subKey) {
    return "service." + this.name.toLowerCase() + "." + subKey;
  }

  translate(key) {
    return language.get(this.translationKey(key));
  }

  log(text, logType) {
    console.log(text, logType);
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
};
