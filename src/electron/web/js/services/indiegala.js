"use strict";

class IndieGala extends Seeker {
  constructor() {
    super();

    this.authContent = "My library";

    this.domain = "indiegala.com";
    this.websiteUrl = "https://www.indiegala.com";
    this.authLink = "https://www.indiegala.com/login";
    this.wonsUrl = "https://www.indiegala.com/profile";

    super.init();
  }

  async authCheck(callback) {
    const authState = await this.indieGalaUser()
      .then(user => (user.username ? 1 : 0))
      .catch(err => (err.status === 200 ? 0 : -1));

    callback(authState);
  }

  async getUserInfo(callback) {
    const userData = await this.indieGalaUser()
      .then(user => ({
        avatar: user.userimage,
        username: user.username,
        value: user.silver_coins_tot
      }))
      .catch(() => ({
        avatar: "https://www.indiegala.com/favicon.ico",
        username: "IG User",
        value: 0
      }));

    callback(userData);
  }

  indieGalaUser() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: "https://www.indiegala.com/get_user_info",
        data: {
          uniq_param: new Date().getTime(),
          show_coins: "True"
        },
        success: response => {
          const withoutHtmlNode = response.replace(/<html.*html>/gs, "");
          resolve(JSON.parse(withoutHtmlNode));
        },
        error: error => reject(error)
      });
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
    const indieGalaUser = await this.indieGalaUser();

    if (indieGalaUser.status !== "ok") return;

    const currentLevel = indieGalaUser.giveaways_user_lever || 0;
    const giveawaysList = await this.getGiveawaysList(page);

    for (const giveaway of giveawaysList) {
      if (currentLevel < giveaway.requiredLevel) continue;

      await this.sleep(this.interval());

      const entryAttempt = await this.giveawayEnter(giveaway.id);

      if (entryAttempt.status === "ok") {
        this.setValue(entryAttempt.silver_tot);
        this.log(
          language.get("service.entered_in") +
            this.logLink(giveaway.detailUrl, giveaway.name)
        );
      }
    }
  }

  getGiveawaysList(page) {
    return new Promise(resolve => {
      $.ajax({
        url: `${this.websiteUrl}/giveaways/ajax/${page}/price/asc/level/all`,
        method: "GET",
        dataType: "html",
        success: response => {
          const clearResponse = this.clearHtmlTags(response, [
            "script"
          ]).replace(/\n/g, "\\n");

          resolve(this.parseGiveaways(JSON.parse(clearResponse).html));
        },
        error: () => resolve([])
      });
    });
  }

  clearHtmlTags(html, tags = []) {
    let result = html;

    for (const tag of tags) {
      const tagQty = html.split(`<${tag}`).length - 1;

      const regExp = new RegExp(`<${tag}.*?>.*?</${tag}>`);

      for (let i = 0; i < tagQty; i++) {
        result = result.replace(regExp, "");
      }
    }

    return result;
  }

  parseGiveaways(html) {
    if (!html || !this.started) return [];

    const giveaways = [];
    const tickets = $(html).find(".items-list-item");

    for (const ticketHtml of tickets) {
      const ticket = $(ticketHtml);
      const ticketLink = ticket.find("h5 a");
      const ticketType = ticket.find(".items-list-item-type");

      const id = ticketLink.attr("href").match(/\d+/)[0];
      const name = ticketLink.text();
      const price = Number(
        ticket.find(".items-list-item-data-button a").data("price")
      );
      const single = ticketType.text().indexOf("single") === 0;
      const detailUrl = this.websiteUrl + ticketLink.attr("href");
      const requiredLevel = (() => {
        const levelSpan = ticketType.find("span");
        if (levelSpan.length === -1) return 0;
        return Number(levelSpan.text().replace("Lev. ", ""));
      })();

      if (!single) continue;

      if (giveaways.filter(ga => ga.id === id).length === 0) {
        giveaways.push({
          id,
          name,
          price,
          single,
          detailUrl,
          requiredLevel
        });
      }
    }

    return giveaways;
  }

  giveawayEnter(id) {
    return Request({
      uri: `${this.websiteUrl}/giveaways/join`,
      body: { id },
      method: "POST",
      json: true,
      headers: {
        authority: "www.indiegala.com",
        accept: "application/json, text/javascript, */*; q=0.01",
        origin: this.websiteUrl,
        referer: `${this.websiteUrl}/giveaways/`,
        cookie: this.cookies,
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "x-requested-with": "XMLHttpRequest",
        "user-agent": Browser.webContents.session.getUserAgent()
      }
    })
      .then(response => response)
      .catch(() => {});
  }
}
