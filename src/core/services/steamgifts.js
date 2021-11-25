const BaseService = require("./base-service");
const query = require("querystring");
const translation = require("../../modules/translation");
const { parse } = require("node-html-parser");

class SteamGifts extends BaseService {
  constructor(settingsStorage) {
    super(settingsStorage, {
      websiteUrl: "https://www.steamgifts.com",
      authPageUrl: "https://www.steamgifts.com/?login",
      winsPageUrl: "https://www.steamgifts.com/giveaways/won",
      authContent: "Account",
    });

    this.settings.points_reserve = {
      type: "number",
      trans: this.translationKey("points_reserve"),
      min: 0,
      max: 500,
      default: this.getConfig("points_reserve", 0),
    };
    this.settings.ending = {
      type: "number",
      trans: this.translationKey("ending"),
      min: 0,
      max: 500,
      default: this.getConfig("ending", 0),
    };
    this.settings.min_chance = {
      type: "float_number",
      trans: this.translationKey("min_chance"),
      min: 0,
      max: 100,
      default: this.getConfig("min_chance", 0),
    };
    this.settings.min_level = {
      type: "number",
      trans: this.translationKey("min_level"),
      min: 0,
      max: 10,
      default: this.getConfig("min_level", 0),
    };
    this.settings.min_cost = {
      type: "number",
      range: true,
      rangeType: "min",
      rangePart: "max_cost",
      trans: this.translationKey("min_cost"),
      min: 0,
      max: 300,
      default: this.getConfig("min_cost", 0),
    };
    this.settings.max_cost = {
      type: "number",
      range: true,
      rangeType: "max",
      rangePart: "min_cost",
      trans: this.translationKey("max_cost"),
      min: 0,
      max: 300,
      default: this.getConfig("max_cost", 0),
    };

    this.settings.sort_by_chance = {
      type: "checkbox",
      trans: this.translationKey("sort_by_chance"),
      default: this.getConfig("sort_by_chance", false),
    };
    this.settings.wishlist_only = {
      type: "checkbox",
      trans: this.translationKey("wishlist_only"),
      default: this.getConfig("wishlist_only", false),
    };
    this.settings.reserve_on_wish = {
      type: "checkbox",
      trans: this.translationKey("reserve_on_wish"),
      default: this.getConfig("reserve_on_wish", false),
    };
    this.settings.ignore_on_wish = {
      type: "checkbox",
      trans: this.translationKey("ignore_on_wish"),
      default: this.getConfig("ignore_on_wish", false),
    };
  }

  async getUserInfo() {
    return this.http
      .get("https://www.steamgifts.com/account/settings/profile")
      .then(response => {
        const document = parse(response.data);

        return {
          avatar: document
            .querySelector(".nav__avatar-inner-wrap")
            .getAttribute("style")
            .match(/http.*jpg/)[0],
          username: document
            .querySelector(".form__input-small")
            .getAttribute("value"),
          value: document.querySelector(".nav__points").structuredText,
        };
      });
  }

  async seekService() {
    await this.enterOnPage(
      "https://www.steamgifts.com/giveaways/search?type=wishlist",
    );

    if (this.getConfig("wishlist_only")) {
      return;
    }

    let currentPage = 1;
    const processPages = this.getConfig("pages", 1);

    do {
      await this.enterOnPage(
        `https://www.steamgifts.com/giveaways/search?page=${currentPage}`,
      );
      currentPage++;
    } while (currentPage <= processPages);
  }

  async enterOnPage(pageUrl) {
    const document = await this.http.get(pageUrl).then(res => parse(res.data));

    const xsrfToken = document
      .querySelectorAll("input")
      .filter(node => node.getAttribute("name") === "xsrf_token")[0]
      .getAttribute("value");

    const giveaways = this.extractGiveaways(document);

    if (this.getConfig("sort_by_chance", false)) {
      giveaways.sort((a, b) => b.winChance - a.winChance);
    }

    const wishlistPage = pageUrl.indexOf("wishlist") > 0;

    for (const giveaway of giveaways) {
      if (!this.isStarted()) {
        return;
      }
      if (!this.canEnterGiveaway(giveaway, wishlistPage)) {
        continue;
      }

      const entry = await this.enterGiveaway(giveaway, xsrfToken);

      if (entry.success) {
        this.setValue(entry.points);
        this.log({
          text: `${translation.get(
            "service.entered_in",
          )} #link#. ${this.translate("cost")} ${
            giveaway.cost
          } ${this.translate("chance")} ${giveaway.winChance}%`,
          anchor: giveaway.name,
          url: `${this.websiteUrl}${giveaway.url}`,
        });
      }
      await this.entryInterval();
    }
  }

  canEnterGiveaway(giveaway, wishlistPage) {
    const minEntryChance = this.getConfig("min_chance", 0);
    const minTimeLeft = this.getConfig("ending", 0) * 60;
    const minEntryLevel = this.getConfig("min_level", 0);
    const minCost = this.getConfig("min_cost", 0);
    const maxCost = this.getConfig("max_cost", 0);
    const pointsReserve = this.getConfig("points_reserve", 0);
    const reserveExceeded = this.currentValue - giveaway.cost < pointsReserve;
    const ignoreSomeSetting = wishlistPage && this.getConfig("ignore_on_wish");

    if (
      (minEntryChance !== 0 && minEntryChance > giveaway.winChance) ||
      (minTimeLeft !== 0 && minTimeLeft < giveaway.timeLeft) ||
      giveaway.entered ||
      !giveaway.levelPass ||
      this.currentValue < giveaway.cost ||
      (wishlistPage && giveaway.pinned)
    ) {
      return false;
    }

    if (
      !ignoreSomeSetting &&
      ((minCost !== 0 && giveaway.cost < minCost) ||
        (maxCost !== 0 && giveaway.cost > maxCost) ||
        (minEntryLevel !== 0 && minEntryLevel > giveaway.levelRequired))
    ) {
      return false;
    }

    if (
      reserveExceeded &&
      (!wishlistPage || !this.getConfig("reserve_on_wish"))
    ) {
      return false;
    }

    return true;
  }

  extractGiveaways(document) {
    const pinnedCodes = document
      .querySelectorAll(
        ".pinned-giveaways__outer-wrap .giveaway__row-outer-wrap",
      )
      .map(htmlNode => this.parseGiveaway(htmlNode).code);

    return document
      .querySelectorAll(".giveaway__row-outer-wrap")
      .map(htmlNode => this.parseGiveaway(htmlNode))
      .map(giveaway => ({
        ...giveaway,
        pinned: pinnedCodes.includes(giveaway.code),
      }));
  }

  parseGiveaway(htmlNode) {
    const currentTime = Math.floor(Date.now() / 1000);
    const infoNodes = htmlNode.querySelectorAll(".giveaway__heading__thin");
    const linkNode = htmlNode.querySelector("a.giveaway__heading__name");
    const levelNode = htmlNode.querySelector(
      ".giveaway__column--contributor-level",
    );

    let copies = 1;
    const url = linkNode.getAttribute("href");
    const entries = Number(
      htmlNode
        .querySelector(".giveaway__links span")
        .structuredText.replace(/[^0-9]/g, ""),
    );
    const timeLeft =
      htmlNode
        .querySelector(".giveaway__columns span")
        .getAttribute("data-timestamp") - currentTime;

    if (infoNodes.length === 2) {
      copies = Number(infoNodes[0].structuredText.replace(/[^0-9]/g, ""));
    }

    const cost = Number(
      infoNodes[infoNodes.length - 1].structuredText.replace(/[^0-9]/g, ""),
    );

    return {
      url,
      cost,
      copies,
      entries,
      timeLeft,
      levelRequired: levelNode
        ? Number(levelNode.structuredText.replace(/[^0-9]/g, ""))
        : 0,
      levelPass: !htmlNode.querySelector(
        ".giveaway__column--contributor-level--negative",
      ),
      name: linkNode.structuredText,
      code: url.split("/")[2],
      entered: !!htmlNode.querySelector(".giveaway__row-inner-wrap.is-faded"),
      winChance: this.calculateWinChance(copies, entries),
    };
  }

  calculateWinChance(copies, entries) {
    const entriesWillBe = entries + 1;
    const winChance = Number(((copies / entriesWillBe) * 100).toFixed(1));

    return winChance > 100 ? 100 : winChance;
  }

  async enterGiveaway(giveaway, xsrfToken) {
    return this.http({
      url: `${this.websiteUrl}/ajax.php`,
      responseType: "json",
      method: "post",
      data: query.stringify({
        xsrf_token: xsrfToken,
        do: "entry_insert",
        code: giveaway.code,
      }),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${this.websiteUrl}${giveaway.url}`,
      },
    })
      .then(res => ({
        success: res.data.type === "success",
        points: res.data.points,
      }))
      .catch(() => ({ success: false }));
  }
}

module.exports = SteamGifts;
