const Seeker = require("../core");
const { parse: parseHtml } = require("node-html-parser");

class GGPlayers extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://ggplayers.com",
      authPageUrl: "https://ggplayers.com/login/",
      authContent: "Log Out",
    });

    this._profileUrl = null;

    delete this.settings.pages;
  }

  async profileUrl() {
    if (!this._profileUrl) {
      const html = await this.http
        .get(this.websiteUrl)
        .then(({ data }) => data);

      const document = parseHtml(html);

      const linkNode = document.querySelector(".bp-profile-nav a");

      this._profileUrl = linkNode.getAttribute("href");
    }

    return this._profileUrl;
  }

  async getUserInfo() {
    const profileUrl = await this.profileUrl();

    return this.http.get(profileUrl).then(response => {
      const document = parseHtml(response.data);

      const avatar = document.querySelector("img.avatar").getAttribute("src");

      return {
        avatar: "https:" + avatar,
        username: document.querySelector(".user-nicename").structuredText,
        value: document.querySelector(".gamipress-buddypress-user-points")
          .structuredText,
      };
    });
  }

  async seekService() {}
}

module.exports = new GGPlayers();
