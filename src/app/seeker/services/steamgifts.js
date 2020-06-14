const Seeker = require("../core");

class Steamgifts extends Seeker {
  constructor() {
    super({});
  }

  seekService() {
    console.log("Iteration");
  }
}

module.exports = new Steamgifts();
