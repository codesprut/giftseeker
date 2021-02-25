const Seeker = require("../core");
const query = require("querystring");
const { parse: parseHtml } = require("node-html-parser");

class MagicDrop extends Seeker {
  constructor() {
    super({
      websiteUrl: "https://magicdrop.top/",
      authPageUrl: "https://magicdrop.top/login",
      authContent: "header_b_user_profile",
      withValue: false,
    });

    delete this.settings.pages;
  }

  async getUserInfo() {
    return this.http.get(this.websiteUrl).then(({ data }) => {
      const document = parseHtml(data);

      const avatar = document
        .querySelector(".header_b_user_profile_t_i img")
        .getAttribute("src");
      const username = document.querySelector(".header_b_user_profile_t_n")
        .structuredText;

      return {
        avatar,
        username,
      };
    });
  }

  async seekService() {
    return this.http({
      url: this.websiteUrl + "/ajax.php?do=freecase_reg",
      data: query.stringify({
        caseName: "free",
      }),
      method: "post",
    }).then(({ data }) => {
      if (data.status === 1) {
        this.log(this.translationKey("free_case_entered"));
      }
    });
  }
}

module.exports = new MagicDrop();
