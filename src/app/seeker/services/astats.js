const Seeker = require("../core");
const language = require("../../language");
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

  async seekService() {
    const giveawaysPageHtml = await this.http
      .get(this.websiteUrl + "TopListGames.php?&DisplayType=Giveaway")
      .then(({ data }) => data);

    const [giveawaysTableHtml] = giveawaysPageHtml.match(
      new RegExp(/<table style="w.*?\/table>/, "s"),
    );

    const giveaways = giveawaysTableHtml
      .match(new RegExp(/<tr>.*?\/tr>/, "gs"))
      .map(this.parseGiveaway)
      .filter(ga => !ga.ended);

    for (const giveaway of giveaways) {
      if (!this.isStarted()) break;

      const entered = await this.enterGiveaway(giveaway);

      if (entered) {
        this.log({
          text: `${language.get("service.entered_in")} #link#`,
          anchor: giveaway.name,
          url: giveaway.url,
        });
      }
      await this.entryInterval();
    }
  }

  parseGiveaway(tableRowHtml) {
    const [, url, id, name] = tableRowHtml.match(
      new RegExp(/<.{12}(\/astats\/G.*?([0-9]+))">(?:<f.*?>)?(.*?)</),
      "gs",
    );

    const ended = tableRowHtml.indexOf("This giveaway has ended") >= 0;

    return {
      url,
      id,
      name,
      ended,
    };
  }

  async enterGiveaway(giveaway) {
    return false;
  }
}

module.exports = new Astats();
