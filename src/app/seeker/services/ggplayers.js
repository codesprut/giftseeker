const Seeker = require("../core");

class GGPlayers extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://ggplayers.com",
      authPageUrl: "https://ggplayers.com/login/",
      authContent: "Log Out",
    });

    delete this.settings.pages;
  }

  async seekService() {}
}

module.exports = new GGPlayers();
