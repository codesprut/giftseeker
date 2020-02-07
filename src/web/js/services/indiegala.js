"use strict";

class IndieGala extends Seeker {
  constructor() {
    super();

    this.authContent = "My Libraries";

    this.domain = "indiegala.com";
    this.websiteUrl = "https://www.indiegala.com";
    this.authLink = "https://www.indiegala.com/login";
    this.wonsUrl = "https://www.indiegala.com/profile";

    super.init();
  }

  async authCheck(callback) {
    const authState = await this.indieGalaUser()
      .then(user => (user.steamnick ? 1 : 0))
      .catch(() => -1);

    callback(authState);
  }

  async getUserInfo(callback) {
    const userData = await this.indieGalaUser()
      .then(user => ({
        avatar: user.steamavatar,
        username: user.steamnick,
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
        dataType: "json",
        success: response => resolve(response),
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
      if (giveaway.entered) continue;

      await this.sleep(this.interval());

      const entryAttempt = await this.giveawayEnter(
        giveaway.id,
        giveaway.price
      );

      if (entryAttempt.status === "ok") {
        this.setValue(entryAttempt.new_amount);
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
        url: "https://www.indiegala.com/giveaways/ajax_data/list",
        data: {
          page_param: page,
          order_type_param: "expiry",
          order_value_param: "asc",
          filter_type_param: "level",
          filter_value_param: "all"
        },
        method: "GET",
        dataType: "json",
        success: response => {
          if (response.status !== "ok") resolve([]);

          resolve(this.parseGiveaways(response.content));
        },
        error: () => resolve([])
      });
    });
  }

  parseGiveaways(html) {
    if (!html || !this.started) return [];

    const giveaways = [];
    const tickets = $(html).find(".tickets-col");

    for (const ticketHtml of tickets) {
      const ticket = $(ticketHtml);

      const id = ticket.find(".ticket-right .relative").attr("rel");
      const name = ticket.find("h2 a").text();
      const price = Number(ticket.find(".ticket-price strong").text());
      const single = ticket.find(".extra-type .fa-clone").length === 0;
      const detailUrl = `https://www.indiegala.com/giveaways/detail/${id}`;
      const requiredLevel = parseInt(ticket.find(".type-level span").text());
      let entered = false;
      let entries = 0;

      if (single) {
        entered = ticket.find(".giv-coupon").length === 0;
        entries = entered ? 1 : 0;
      } else {
        entries = parseInt(ticket.find(".giv-coupon .palette-color-11").text());
        entered = entries > 0;
      }

      giveaways.push({
        id,
        name,
        price,
        single,
        detailUrl,
        requiredLevel,
        entered,
        entries
      });
    }

    return giveaways;
  }

  giveawayEnter(id, price) {
    return Request({
      method: "POST",
      uri: `${this.websiteUrl}/giveaways/new_entry`,
      form: JSON.stringify({ giv_id: id, ticket_price: price }),
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
      },
      json: true
    })
      .then(response => response)
      .catch(() => {});
  }
}
