const Seeker = require("../core");

class JustCase extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://justcase.fun/",
      authPageUrl: "https://justcase.fun/auth",
      authContent: 'steam_url":',
      withValue: false,
    });

    delete this.settings.pages;
  }

  async getUserInfo() {
    return this.http.get(this.websiteUrl).then(({ data }) => {
      const [, username] = data.match(/"steam_id".*name":"(.*?)"/);
      const [, avatar] = data.match(/"avatar":"(http.*?)"/);

      return {
        avatar,
        username,
      };
    });
  }

  async seekService() {}
}

module.exports = new JustCase();
