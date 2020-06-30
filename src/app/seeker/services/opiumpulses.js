const Seeker = require("../core");
const language = require("../../language");
const { parse } = require("node-html-parser");
const states = require("../states");

class OpiumPulses extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://www.opiumpulses.com",
      authPageUrl: "https://www.opiumpulses.com/site/login",
      winsPageUrl: "https://www.opiumpulses.com/user/giveawaykeys",
      authContent: "/site/logout"
    });

    delete this.settings.pages;

    this.events.on("state.changed", newState => {
      if (newState === states.STARTED)
        this.log(language.get(this.translationKey("on_start_reminder")));
    });
  }

  async getUserInfo() {
    return this.http.get(`${this.websiteUrl}/user/account`).then(response => {
      const document = parse(response.data);

      return {
        avatar: document.querySelector("img.img-thumbnail").getAttribute("src"),
        username: document
          .querySelector("#User_username")
          .getAttribute("value"),
        value: document
          .querySelector(".points-items li a")
          .structuredText.replace("Points:", "")
          .trim()
      };
    });
  }

  async seekService() {
    await this.setGiveawaysFilter();

    const giveaways = await this.http
      .get(`${this.websiteUrl}/giveaways`)
      .then(({ data }) =>
        parse(data)
          .querySelectorAll(".giveaways-page-item")
          .map(this.parseGiveaway)
          .filter(ga => !ga.entered && ga.cost === 0)
      );

    for (const giveaway of giveaways) {
      if (!this.isStarted()) break;

      await this.sleep(this.entryInterval());
      const entered = await this.enterGiveaway(giveaway);

      if (entered) {
        this.log({
          text: `${language.get("service.entered_in")} #link#`,
          anchor: giveaway.name,
          url: this.websiteUrl + giveaway.url
        });
      }
    }
  }

  async setGiveawaysFilter() {
    return this.http.get(`${this.websiteUrl}/giveaway/filterGiveaways`, {
      params: {
        source: "gf",
        pageSize: 240,
        jointypes: "everyone",
        status: "active",
        ajax: 1
      }
    });
  }

  parseGiveaway(htmlNode) {
    const entered = !!htmlNode.querySelector(".entered");
    const url = htmlNode
      .querySelector(".giveaways-page-item-img-btn-more")
      .getAttribute("href");
    const cost = Number(
      htmlNode
        .querySelector(".giveaways-page-item-header-points")
        .structuredText.replace(/[^0-9]/g, "")
    );

    const checkUser = entered
      ? false
      : htmlNode
          .querySelector(".giveaways-page-item-img-btn-enter")
          .getAttribute("onClick")
          .replace(/[^0-9]/g, "");

    return {
      name: htmlNode.querySelector(".giveaways-page-item-footer-name")
        .structuredText,
      url,
      cost,
      free: cost === 0,
      code: url.split("/")[2],
      entered,
      checkUser
    };
  }

  async enterGiveaway(giveaway) {
    this.modifyCookie([["checkUser", giveaway.checkUser]]);
    return this.http
      .get(`${this.websiteUrl}/giveaways/enter/${giveaway.code}`)
      .then(({ data }) => data.indexOf("entered this") >= 0)
      .catch(() => false);
  }
}

module.exports = new OpiumPulses();
