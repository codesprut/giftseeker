const { parse } = require("node-html-parser");

const authState = require("../auth-state.enum");
const BaseService = require("./base-service");
const translation = require("../../modules/translation");
const clearHtmlTags = require("../utils/clear-html-tags");

class IndieGala extends BaseService {
  constructor(settingsStorage) {
    super(settingsStorage, {
      websiteUrl: "https://www.indiegala.com",
      authPageUrl: "https://www.indiegala.com/login",
      winsPageUrl: "https://www.indiegala.com/profile",
      requestTimeout: 15000,
    });
  }

  async authCheck() {
    return this.http(`${this.websiteUrl}/giveaways`)
      .then(res => {
        const document = parse(res.data);
        const usernameNode = document.querySelector(".username-text");

        return usernameNode ? authState.AUTHORIZED : authState.NOT_AUTHORIZED;
      })
      .catch(ex => {
        if (ex.code === "HPE_INVALID_HEADER_TOKEN") {
          return authState.NOT_AUTHORIZED;
        }

        return ex.status === 200
          ? authState.NOT_AUTHORIZED
          : authState.CONNECTION_REFUSED;
      });
  }

  async getUserInfo() {
    return this.http.get(`${this.websiteUrl}/giveaways`).then(response => {
      const document = parse(response.data);

      return {
        avatar: document.querySelector("figure.avatar img").getAttribute("src"),
        username: document.querySelector(".username-text").structuredText,
        value: document.querySelector("#galasilver-amount").structuredText,
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
    return this.http
      .get(`${this.websiteUrl}/library/giveaways/user-level-and-coins`, {
        transformResponse: this.jsonResponseTransformer,
      })
      .then(res => {
        return Number(res.data.current_level);
      })
      .catch(() => 0);
  }

  async getCsrfToken() {
    return this.http.get(`${this.websiteUrl}/giveaways`).then(({ data }) => {
      const document = parse(data);
      const tokenInput = document.querySelector(
        "input[name=csrfmiddlewaretoken]",
      );

      return tokenInput.getAttribute("value");
    });
  }

  async enterOnPage(page, userLevel) {
    const csrfToken = await this.getCsrfToken();
    const enteredGiveawayIds = await this.getEnteredGiveawayIds();

    const document = await this.http
      .get(`${this.websiteUrl}/giveaways/ajax/${page}/expiry/asc/level/all`, {
        transformResponse: this.clearResponse,
      })
      .then(res => parse(res.data.html));

    const giveaways = document
      .querySelectorAll(".items-list-item")
      .map(it => this.parseGiveaway(it, enteredGiveawayIds))
      .filter(it => it.requiredLevel <= userLevel && !it.entered && it.single)
      .reduce((distinct, current) => {
        if (distinct.filter(it => it.id === current.id).length === 0) {
          distinct.push(current);
        }
        return distinct;
      }, []);

    for (const giveaway of giveaways) {
      if (!this.isStarted()) {
        return;
      }

      const entry = await this.enterGiveaway(
        giveaway.id,
        giveaway.token,
        csrfToken,
      );

      if (entry.status === "ok") {
        this.log({
          text: `${translation.get("service.entered_in")} #link#`,
          anchor: giveaway.name,
          url: this.websiteUrl + giveaway.url,
        });
        this.setValue(entry.silver_tot);
      }
      await this.entryInterval();
    }
  }

  async getEnteredGiveawayIds() {
    const document = await this.http
      .get(
        `${this.websiteUrl}/library/giveaways/giveaways-in-progress/entries`,
        {
          transformResponse: this.clearResponse,
        },
      )
      .then(res => parse(res.data.html));

    return document
      .querySelectorAll("a:not([href='#'])")
      .map(it => it.getAttribute("href").match(/[0-9]+$/)[0]);
  }

  parseGiveaway(htmlNode, enteredIds) {
    const linkNode = htmlNode.querySelector("h5 a");
    const typeNode = htmlNode.querySelector(".items-list-item-type");
    const actionNode = htmlNode.querySelector("a.items-list-item-ticket-click");
    const price = Number(
      htmlNode
        .querySelector(".items-list-item-data-button a")
        ?.getAttribute("data-price") ?? 0,
    );
    const giveawayId = linkNode.getAttribute("href").match(/\d+/)[0];
    const single = typeNode.structuredText.indexOf("single") === 0;
    const requiredLevel = (() => {
      const levelSpan = typeNode.querySelector("span");
      if (!levelSpan) {
        return 0;
      }
      return Number(levelSpan.structuredText.replace("Lev. ", ""));
    })();

    return {
      id: giveawayId,
      url: linkNode.getAttribute("href"),
      name: linkNode.structuredText,
      token: actionNode.getAttribute("onclick").match(/[0-9], '(.*)'\)/)[1],
      entered: enteredIds.some(it => it === giveawayId),
      price,
      single,
      requiredLevel,
    };
  }

  async enterGiveaway(giveawayId, giveawayToken, csrfToken) {
    return this.http({
      transformResponse: this.jsonResponseTransformer,
      url: `${this.websiteUrl}/giveaways/join`,
      data: { id: giveawayId, token: giveawayToken },
      method: "post",
      headers: {
        authority: "www.indiegala.com",
        accept: "application/json, text/javascript, */*; q=0.01",
        origin: this.websiteUrl,
        referer: `${this.websiteUrl}/giveaways/`,
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "x-requested-with": "XMLHttpRequest",
        "x-csrf-token": csrfToken,
        "x-csrftoken": csrfToken,
      },
    })
      .then(res => res.data)
      .catch(() => ({
        status: "error",
      }));
  }

  jsonResponseTransformer(data) {
    return typeof data === "string" ? JSON.parse(data) : data;
  }

  clearResponse(data) {
    const response = clearHtmlTags(data, ["script"]).replace(/\n/g, "\\n");

    return JSON.parse(response);
  }
}

module.exports = IndieGala;
