"use strict";

class Follx extends Seeker {
  constructor() {
    super();

    this.settings.timer.min = 5;

    this.websiteUrl = "https://follx.com";
    this.authLink = "https://follx.com/logIn";
    this.wonsUrl = "https://follx.com/giveaways/won";

    this.authContent = "/account";

    super.init();
  }

  getUserInfo(callback) {
    let userData = {
      avatar: "https://follx.com/favicon.ico",
      username: "Follx User",
      value: 0
    };

    $.ajax({
      url: "https://follx.com/users/" + GSuser.steamid,
      success: function(data) {
        let html = $(data);

        userData.avatar = html.find(".card-cover img").attr("src");
        userData.username = html
          .find(".username")
          .first()
          .text();
        userData.value = html
          .find(".user .energy span")
          .first()
          .text();
      },
      complete: function() {
        callback(userData);
      }
    });
  }

  seekService() {
    let _this = this;
    let page = 1;

    let callback = function() {
      page++;

      if (page <= _this.getConfig("pages", 1))
        _this.enterOnPage(page, callback);
    };

    this.enterOnPage(page, callback);
  }

  enterOnPage(page, callback) {
    let _this = this;
    let CSRF = "";

    $.get("https://follx.com/giveaways?page=" + page, function(html) {
      html = $("<div>" + html + "</div>");

      CSRF = html.find('meta[name="csrf-token"]').attr("content");

      if (CSRF.length < 10) {
        _this.log(this.trans("token_error"), true);
        _this.stopSeeker(true);
        return;
      }

      let found_games = html.find(".giveaway_card");
      let curr_giveaway = 0;

      function giveawayEnter() {
        if (found_games.length <= curr_giveaway || !_this.started) {
          if (callback) callback();

          return;
        }

        let next_after = _this.interval();
        let card = found_games.eq(curr_giveaway),
          link = card.find(".head_info a").attr("href"),
          name = card.find(".head_info").attr("title"),
          have = card.find(".giveaway-indicators > .have").length > 0,
          entered = card.find(".entered").length > 0;

        if (have || entered) next_after = 50;
        else {
          $.get(link, function(html) {
            if (html.indexOf('data-action="enter"') > 0) {
              $.ajax({
                method: "post",
                url: link + "/action",
                data: "action=enter",
                dataType: "json",
                headers: {
                  "X-Requested-With": "XMLHttpRequest",
                  "X-CSRF-TOKEN": CSRF
                },
                success: function(data) {
                  if (data.response) {
                    _this.setValue(data.points);
                    _this.log(
                      Lang.get("service.entered_in") + _this.logLink(link, name)
                    );
                  }
                }
              });
            }
          });
        }

        curr_giveaway++;
        setTimeout(giveawayEnter, next_after);
      }

      giveawayEnter();
    });
  }
}
