"use strict";

class SteamGifts extends Seeker {
  constructor() {
    super();

    this.websiteUrl = "https://www.steamgifts.com";
    this.authContent = "Account";
    this.authLink = "https://www.steamgifts.com/?login";
    this.wonsUrl = "https://www.steamgifts.com/giveaways/won";

    this.settings.points_reserve = {
      type: "number",
      trans: this.transPath("points_reserve"),
      min: 0,
      max: 500,
      default: this.getConfig("points_reserve", 0)
    };
    this.settings.ending = {
      type: "number",
      trans: this.transPath("ending"),
      min: 0,
      max: 500,
      default: this.getConfig("ending", 0)
    };
    this.settings.min_chance = {
      type: "float_number",
      trans: this.transPath("min_chance"),
      min: 0,
      max: 100,
      default: this.getConfig("min_chance", 0)
    };
    this.settings.min_level = {
      type: "number",
      trans: this.transPath("min_level"),
      min: 0,
      max: 10,
      default: this.getConfig("min_level", 0)
    };
    this.settings.min_cost = {
      type: "number",
      trans: this.transPath("min_cost"),
      min: 0,
      max: this.getConfig("max_cost", 0),
      default: this.getConfig("min_cost", 0)
    };
    this.settings.max_cost = {
      type: "number",
      trans: this.transPath("max_cost"),
      min: this.getConfig("min_cost", 0),
      max: 300,
      default: this.getConfig("max_cost", 0)
    };

    this.settings.sort_by_chance = {
      type: "checkbox",
      trans: this.transPath("sort_by_chance"),
      default: this.getConfig("sort_by_chance", false)
    };
    this.settings.wishlist_only = {
      type: "checkbox",
      trans: this.transPath("wishlist_only"),
      default: this.getConfig("wishlist_only", false)
    };
    this.settings.reserve_on_wish = {
      type: "checkbox",
      trans: this.transPath("reserve_on_wish"),
      default: this.getConfig("reserve_on_wish", false)
    };
    this.settings.ignore_on_wish = {
      type: "checkbox",
      trans: this.transPath("ignore_on_wish"),
      default: this.getConfig("ignore_on_wish", false)
    };

    this.token = "";
    this.giveaways = [];

    super.init();
  }

  getUserInfo(callback) {
    let userData = {
      avatar: "https://cdn.steamgifts.com/img/favicon.ico",
      username: "SG User",
      value: 0
    };

    $.ajax({
      url: "https://www.steamgifts.com/account/settings/profile",
      success: function(data) {
        data = $(data);

        userData.avatar = data
          .find(".nav__avatar-inner-wrap")
          .attr("style")
          .replace("background-image:url(", "")
          .replace(");", "");
        userData.username = data.find("input[name=username]").val();
        userData.value = data.find(".nav__points").text();
      },
      complete: function() {
        callback(userData);
      }
    });
  }

  seekService() {
    let page = 1;
    this.giveaways = [];

    // Общий список раздач
    let processCommon = () => {
      if (!this.started) return;

      if (page <= this.getConfig("pages", 1))
        this.giveawaysFromUrl(
          "https://www.steamgifts.com/giveaways/search?page=" + page,
          processCommon
        );
      else this.giveawaysEnter();

      page++;
    };

    // Список желаемого
    this.giveawaysFromUrl(
      "https://www.steamgifts.com/giveaways/search?type=wishlist",
      () => {
        this.giveawaysEnter(true);

        if (this.getConfig("wishlist_only")) return;

        this.giveaways = [];

        processCommon();
      }
    );
  }

  giveawaysFromUrl(url, callback) {
    $.ajax({
      url: url,
      method: "get",
      success: data => {
        data = $("<div>" + data + "</div>");

        this.token = data.find('input[name="xsrf_token"]').val();

        if (this.token.length < 10) {
          this.log(this.trans("token_error"), true);
          this.stopSeeker(true);
          return;
        }

        data.find(".giveaway__row-outer-wrap").each((index, item) => {
          let giveaway = $(item);

          let copies = 1;
          let link =
            "https://www.steamgifts.com" +
            giveaway.find("a.giveaway__heading__name").attr("href");
          let entries = parseInt(
            giveaway
              .find(".fa.fa-tag+span")
              .text()
              .replace(/[^0-9]/g, "")
          );
          let left = giveaway
            .find("[data-timestamp]")
            .first()
            .text()
            .split(" ");
          let factor = 1;

          switch (left[1]) {
            case "hour":
            case "hours":
              factor = 60;
              break;
            case "day":
            case "days":
              factor = 1440;
              break;
            case "week":
            case "weeks":
              factor = 10080;
              break;
            case "month":
            case "months":
              factor = 40320;
              break;
          }

          let detectQty = giveaway
            .find(".giveaway__heading__thin")
            .first()
            .text();
          if (detectQty.indexOf("Copies") > 0)
            copies = parseInt(detectQty.replace(/[^0-9]/g, ""));

          let chance = parseFloat(((copies / entries) * 100).toFixed(2));

          let GA = {
            chance: chance === Infinity ? 0 : chance,
            pinned:
              giveaway.closest(".pinned-giveaways__outer-wrap").length > 0,
            link: link,
            left: parseInt(left[0]) * factor,
            copies: copies,
            entries: entries,
            code: link.match(/away\/(.*)\//)[1],
            name: giveaway.find("a.giveaway__heading__name").text(),
            level:
              giveaway.find(".giveaway__column--contributor-level").length > 0
                ? parseInt(
                    giveaway
                      .find(".giveaway__column--contributor-level")
                      .text()
                      .replace("+", "")
                      .replace("Level ", "")
                  )
                : 0,
            levelPass:
              giveaway.find(".giveaway__column--contributor-level--negative")
                .length === 0,
            cost: parseInt(
              giveaway
                .find("a.giveaway__icon[rel]")
                .prev()
                .text()
                .replace(/[^0-9]/g, "")
            ),
            entered:
              giveaway.find(".giveaway__row-inner-wrap.is-faded").length > 0
          };

          if (
            !GA.entered && // Ещё не участвую
            GA.levelPass && // Подхожу по уровню
            (this.getConfig("ending", 0) === 0 ||
              GA.left <= this.getConfig("ending", 0)) && // Время до окончания
            (this.getConfig("min_chance", 0) === 0 ||
              GA.chance >= this.getConfig("min_chance", 0)) // Минимальный шанс
          )
            this.giveaways.push(GA);
        });
      },
      complete: () => {
        if (callback) callback();
      }
    });
  }

  giveawaysEnter(wishlist, callback) {
    let _this = this;
    let curr_giveaway = 0;

    if (this.getConfig("sort_by_chance", false))
      this.giveaways.sort((a, b) => {
        return b.chance - a.chance;
      });

    function processOne() {
      if (_this.giveaways.length <= curr_giveaway || !_this.started) {
        if (callback) callback(false);

        return;
      }

      let next_after = _this.interval();
      let GA = _this.giveaways[curr_giveaway],
        ignoreForWishlist = wishlist && _this.getConfig("ignore_on_wish");

      if (
        (!wishlist || !GA.pinned) && // не вступать в закреплённые со страницы вишлиста
        _this.curr_value >= GA.cost && // Имеется необходимое кол-во очков
        (ignoreForWishlist ||
          _this.getConfig("min_level") === 0 ||
          GA.level >= _this.getConfig("min_level")) && // Минимальный уровень
        (ignoreForWishlist || GA.cost >= _this.getConfig("min_cost")) && // Минимальная стоимость
        (ignoreForWishlist ||
          _this.getConfig("max_cost") === 0 ||
          GA.cost <= _this.getConfig("max_cost")) && // Максимальная стоимость
        ((wishlist && _this.getConfig("reserve_on_wish")) ||
          _this.getConfig("points_reserve") === 0 ||
          _this.curr_value - GA.cost >= _this.getConfig("points_reserve")) // Резерв очков
      ) {
        $.ajax({
          url: "https://www.steamgifts.com/ajax.php",
          method: "post",
          dataType: "json",
          data: {
            xsrf_token: _this.token,
            do: "entry_insert",
            code: GA.code
          },
          success: function(data) {
            if (data.type === "success") {
              _this.log(
                language.get("service.entered_in") +
                  _this.logLink(GA.link, GA.name) +
                  ". " +
                  _this.trans("cost") +
                  " - " +
                  GA.cost +
                  ", " +
                  _this.trans("chance") +
                  " - " +
                  GA.chance +
                  "%"
              );
              _this.setValue(data.points);
            }
          }
        });
      } else next_after = 50;

      curr_giveaway++;
      setTimeout(processOne, next_after);
    }

    processOne();
  }
}
