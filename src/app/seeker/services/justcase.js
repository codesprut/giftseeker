const Seeker = require("../core");
const { parse: parseHtml } = require("node-html-parser");

class JustCase extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://justcase.fun/",
      authPageUrl: "https://justcase.fun/auth",
      authContent: "user-avatar",
      withValue: false,
    });

    delete this.settings.pages;
  }

  async getUserInfo() {
    return this.http.get(this.websiteUrl).then(({ data }) => {
      const document = parseHtml(data);

      const avatar = document
        .querySelector(".user-avatar__wrapper img")
        .getAttribute("src");
      const username = document.querySelector(".user__text-name")
        .structuredText;

      return {
        avatar,
        username,
      };
    });
  }

  async seekService() {}
}

module.exports = new JustCase();
