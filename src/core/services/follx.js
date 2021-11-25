const BaseService = require("./base-service");
const translation = require("../../modules/translation");
const { parse } = require("node-html-parser");

class Follx extends BaseService {
  constructor() {
    super({
      websiteUrl: "https://follx.com",
      authPageUrl: "https://follx.com/logIn",
      winsPageUrl: "https://follx.com/giveaways/won",
      authContent: "/account",
    });
  }

  async getUserInfo() {
    return this.http.get(this.websiteUrl).then(response => {
      const document = parse(response.data);

      return {
        avatar: document
          .querySelector("span.avatar")
          .toString()
          .match(/http.*jpg/)[0],
        username: document.querySelector(".username").structuredText,
        value: document.querySelector(".energy span").structuredText,
      };
    });
  }

  async seekService() {
    let currentPage = 1;
    const processPages = this.getConfig("pages", 1);

    do {
      await this.enterOnPage(currentPage);
      currentPage++;
    } while (currentPage <= processPages);
  }

  async enterOnPage(page) {
    const document = await this.http
      .get(`${this.websiteUrl}/giveaways`, {
        page,
      })
      .then(response => parse(response.data));

    const csrfToken = document
      .querySelectorAll("meta")
      .filter(node => node.getAttribute("name") === "csrf-token")[0]
      .getAttribute("content");

    const giveaways = document
      .querySelectorAll(".giveaway_card")
      .map(card => ({
        url: card.querySelector(".head_info a").getAttribute("href"),
        name: card.querySelector(".head_info").getAttribute("title"),
        have: !!card.querySelector("span.have"),
        entered: !!card.querySelector(".entered"),
        entries: card.querySelector(".entries").structuredText,
      }))
      .filter(ga => !ga.have && !ga.entered);

    for (const giveaway of giveaways) {
      if (!this.isStarted()) {
        break;
      }

      const entered = await this.enterGiveaway(giveaway, csrfToken);

      if (entered) {
        this.log({
          text: `${translation.get("service.entered_in")} #link#`,
          anchor: giveaway.name,
          url: giveaway.url,
        });
      }
      await this.entryInterval();
    }
  }

  async enterGiveaway(giveaway, csrfToken) {
    return this.http({
      url: `${giveaway.url}/action`,
      method: "post",
      data: "action=enter",
      responseType: "json",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": csrfToken,
      },
    })
      .then(res => res.data.entries > giveaway.entries)
      .catch(() => false);
  }
}

module.exports = Follx;
