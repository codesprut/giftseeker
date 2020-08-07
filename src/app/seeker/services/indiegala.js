const Seeker = require("../core");
const language = require("../../language");
const { parse } = require("node-html-parser");
const clearHtmlTags = require("../../utils/clear-html-tags");

class IndieGala extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://www.indiegala.com",
      authPageUrl: "https://www.indiegala.com/login",
      winsPageUrl: "https://www.indiegala.com/profile",
      authContent: "My library",
      requestTimeout: 15000
    });
  }

  async authCheck() {
    return this.http
      .get(this.websiteUrl)
      .then(res => (res.data.indexOf(this.authContent) >= 0 ? 1 : 0))
      .catch(err => {
        if (err.code === "HPE_INVALID_HEADER_TOKEN") return 0;
        return err.status === 200 ? 0 : -1;
      });
  }

  async getUserInfo() {
    return this.http.get(`${this.websiteUrl}/giveaways`).then(response => {
      const document = parse(response.data);

      return {
        avatar: document.querySelector("figure.avatar img").getAttribute("src"),
        username: document.querySelector(".username-text").structuredText,
        value: document.querySelector("#galasilver-amount").structuredText
      };
    });
  }

  async seekService() {
    let currentPage = 1;
    const processPages = this.getConfig("pages", 1);
    const userLevel = await this.getUserLevel();

    do {
      await this.enterOnPage(currentPage, userLevel);
      currentPage++;
    } while (currentPage <= processPages);
  }

  async getUserLevel() {
    return this.http(
      `${this.websiteUrl}/library/giveaways/user-level-and-coins`
    )
      .then(res => Number(res.data.current_level))
      .catch(() => 0);
  }

  async enterOnPage(page, userLevel) {
    const document = await this.http
      .get(`${this.websiteUrl}/giveaways/ajax/${page}/expiry/asc/level/all`, {
        transformResponse: this.clearResponse
      })
      .then(res => parse(res.data.html));

    const giveaways = document
      .querySelectorAll(".items-list-item")
      .map(this.parseGiveaway)
      .filter(ga => ga.requiredLevel <= userLevel && !ga.entered && ga.single)
      .reduce((distinct, current) => {
        if (distinct.filter(it => it.id === current.id).length === 0)
          distinct.push(current);
        return distinct;
      }, []);

    for (const giveaway of giveaways) {
      if (!this.isStarted()) return;

      const entry = await this.enterGiveaway(giveaway.id);

      if (entry.status === "ok") {
        this.log({
          text: `${language.get("service.entered_in")} #link#`,
          anchor: giveaway.name,
          url: this.websiteUrl + giveaway.url
        });
        this.setValue(entry.silver_tot);
      }
      await this.entryInterval();
    }
  }

  parseGiveaway(htmlNode) {
    const linkNode = htmlNode.querySelector("h5 a");
    const typeNode = htmlNode.querySelector(".items-list-item-type");
    const entered = !htmlNode.querySelector(".items-list-item-ticket");
    const price = entered
      ? 0
      : Number(
          htmlNode
            .querySelector(".items-list-item-data-button a")
            .getAttribute("data-price"),
        );
    const single = typeNode.structuredText.indexOf("single") === 0;
    const requiredLevel = (() => {
      const levelSpan = typeNode.querySelector("span");
      if (!levelSpan) return 0;
      return Number(levelSpan.structuredText.replace("Lev. ", ""));
    })();

    return {
      id: linkNode.getAttribute("href").match(/\d+/)[0],
      url: linkNode.getAttribute("href"),
      name: linkNode.structuredText,
      entered,
      price,
      single,
      requiredLevel
    };
  }

  async enterGiveaway(giveawayId) {
    return this.http({
      url: `${this.websiteUrl}/giveaways/join`,
      data: { id: giveawayId },
      method: "post",
      headers: {
        authority: "www.indiegala.com",
        accept: "application/json, text/javascript, */*; q=0.01",
        origin: this.websiteUrl,
        referer: `${this.websiteUrl}/giveaways/`,
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "x-requested-with": "XMLHttpRequest"
      }
    })
      .then(res => res.data)
      .catch(() => ({ status: "error" }));
  }

  clearResponse(data) {
    const response = clearHtmlTags(data, ["script"]).replace(/\n/g, "\\n");

    return JSON.parse(response);
  }
}

module.exports = new IndieGala();
