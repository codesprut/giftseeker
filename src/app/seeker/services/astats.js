const Seeker = require("../core");
const { parse: parseHtml } = require("node-html-parser");

class Astats extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://astats.astats.nl/astats/",
      authPageUrl: "https://astats.astats.nl/astats/profile/Login.php",
      authContent: "Log out",
      withValue: false,
    });

    delete this.settings.pages;
  }

  async getUserInfo() {
    return this.http
      .get(this.websiteUrl + "User_Info.php")
      .then(({ data }) => ({
        avatar: data.match(/"src="(.*?)"/)[1],
        username: parseHtml(data).querySelector("h2").structuredText,
      }));
  }
}

module.exports = new Astats();
