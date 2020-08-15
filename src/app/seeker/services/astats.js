const Seeker = require("../core");

class Astats extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://astats.astats.nl/astats/",
      authPageUrl: "https://astats.astats.nl/astats/profile/Login.php",
      authContent: "Log out",
    });
  }

  async seekService() {}
}

module.exports = new Astats();
