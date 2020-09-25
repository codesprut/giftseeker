const settings = require("../settings");
const language = require("../language");
const states = require("./states");
const events = require("events");
const axios = require("axios");
const https = require("https");

module.exports = class Seeker {
  constructor({ withValue = true, ...params }) {
    this.currentValue = 0;
    this.withValue = withValue;

    this.updateUserInterval = 300;

    this.reconnectTimeout = null;
    this.state = states.PAUSED;

    this.name = this.constructor.name;

    this.domain = params.domain;
    this.websiteUrl = params.websiteUrl;
    this.authPageUrl = params.authPageUrl;
    this.winsPageUrl = params.winsPageUrl;
    this.authContent = params.authContent;

    this.events = new events.EventEmitter();

    this.settings = {
      timer: {
        type: "number",
        trans: "service.timer",
        min: 5,
        max: 999,
        default: this.getConfig("timer", 10),
      },
      interval_from: {
        type: "number",
        range: true,
        rangeType: "min",
        rangePart: "interval_to",
        trans: "service.interval_from",
        min: 0,
        max: 60,
        default: this.getConfig("interval_from", 3),
      },
      interval_to: {
        type: "number",
        range: true,
        rangeType: "max",
        rangePart: "interval_from",
        trans: "service.interval_to",
        min: 3,
        max: 60,
        default: this.getConfig("interval_to", 5),
      },
      pages: {
        type: "number",
        trans: "service.pages",
        min: 1,
        max: 10,
        default: this.getConfig("pages", 1),
      },
    };

    this.http = axios.create({
      timeout: params.requestTimeout || 5000,
      responseType: "text",
      withCredentials: true,
      headers: {
        Referer: this.websiteUrl,
        "User-Agent": settings.get("user_agent"),
        Cookie: this.getConfig("cookie", ""),
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    this.http.interceptors.response.use(response => {
      const host = response.request.socket.servername;
      if (
        this.websiteUrl.indexOf(host) >= 0 &&
        response.headers["set-cookie"]
      ) {
        const cookieArray = this.parseSetCookieHeader(
          response.headers["set-cookie"],
        );

        this.modifyCookie(cookieArray);
      }

      return response;
    });

    settings.on("change", "user_agent", userAgent => {
      this.http.defaults.headers["User-Agent"] = userAgent;
    });
  }

  on(eventName, callback) {
    this.events.on(eventName, callback);
  }

  async authCheck() {
    return this.http
      .get(this.websiteUrl)
      .then(res => (res.data.indexOf(this.authContent) >= 0 ? 1 : 0))
      .catch(err => (err.status === 200 ? 0 : -1));
  }

  parseSetCookieHeader(header) {
    return header.map(row => {
      const [[name, value]] = row
        .split(";")
        .map(param => param.trim().split("="));

      return [name, value];
    });
  }

  modifyCookie(cookieArray) {
    let needUpdate = false;
    const currentCookies = new Map(
      this.getConfig("cookie", "")
        .split(";")
        .filter(row => row.length)
        .map(row => row.trim().split("=")),
    );
    cookieArray.forEach(cookie => {
      const [name, newValue] = cookie;
      if (currentCookies.get(name) !== newValue) {
        needUpdate = true;
        currentCookies.set(name, newValue);
      }
    });

    if (needUpdate)
      this.setCookie([...currentCookies].map(it => it.join("=")).join("; "));
  }

  setCookie(cookie) {
    this.setConfig("cookie", cookie);
    this.http.defaults.headers.Cookie = cookie;
  }

  async start(autostart) {
    if (this.isStarted()) return false;

    this.setState(states.PROCESS);
    const authState = await this.authCheck();

    switch (authState) {
      case 1:
        this.setStateStarted();
        break;
      case 0:
        if (autostart) {
          this.setState(states.ERROR);
          this.log(language.get("service.cant_start"), true);
        } else this.setState(states.PAUSED);
        break;
      case -1:
        this.setState(states.ERROR);
        this.log(language.get("service.connection_error"), true);
        if (autostart) this.runReconnectTimeout();
        break;
    }

    return authState;
  }

  async stop(withError, reconnect) {
    const state = withError ? states.ERROR : states.PAUSED;
    if (!this.isStarted()) return false;

    this.setState(state);

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

  async setStateStarted() {
    this.totalTicks = 0;
    this.setState(states.STARTED);
    this.log(language.get("service.started"));
  }

  runWorker() {
    this.log(language.get("service.loaded"));

    if (this.workerIntervalId) return;
    this.totalTicks = 0;

    this.workerIntervalId = setInterval(async () => {
      this.serviceActions(this.totalTicks, this.isStarted());
      this.totalTicks = this.totalTicks < 32760 ? this.totalTicks + 1 : 0;
      this.events.emit("tick", this.totalTicks);
    }, 1000);
  }

  stopWorker() {
    clearInterval(this.workerIntervalId);
    this.workerIntervalId = null;
  }

  clearEvents() {
    this.events.removeAllListeners();
  }

  async serviceActions(currentTick, serviceStarted) {
    if (currentTick % this.updateUserInterval === 0)
      await this.updateUserInfo();

    if (serviceStarted) {
      if (currentTick % this.workerInterval() === 0) {
        const authState = await this.authCheck();

        switch (authState) {
          case 1:
            this.seekService();
            break;
          case 0:
            this.log(language.get("service.session_expired"), true);
            this.stop(true);
            break;
          case -1:
            this.log(language.get("service.connection_lost"), true);
            this.stop(true, true);
            break;
        }
      }
    }
  }

  async updateUserInfo() {
    const authState = await this.authCheck();

    if (authState === 1) {
      const userInfo = await this.getUserInfo().catch(() => ({
        avatar: `${this.websiteUrl}/favicon.ico`,
        username: `${this.name} user`,
        value: 0,
      }));

      this.events.emit("userinfo.updated", userInfo);

      this.setValue(userInfo.value);
    }
  }

  entryInterval() {
    const min = this.getConfig(
      "interval_from",
      this.settings.interval_from.default,
    );
    const max =
      this.getConfig("interval_to", this.settings.interval_to.default) + 1;

    const intervalMs = (Math.floor(Math.random() * (max - min)) + min) * 1000;
    return new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  workerInterval() {
    return this.getConfig("timer", 10) * 60;
  }

  setState(state) {
    if (this.state === state) return;

    this.events.emit("state.changed", state);
    this.state = state;
  }

  isStarted() {
    return this.state === states.STARTED;
  }

  setValue(newValue) {
    if (!this.withValue) return;

    this.events.emit("value.changed", newValue);
    this.currentValue = parseInt(newValue);
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

  log(text, type) {
    this.events.emit("log", { text, type });
  }

  async seekService() {}

  async getUserInfo() {
    throw new Error("Not implemented");
  }
};
