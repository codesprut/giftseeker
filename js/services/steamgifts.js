'use strict';

class SteamGifts extends Seeker {

	constructor() {
		super();

		this.websiteUrl  = 'https://www.steamgifts.com';
		this.authContent = 'Account';
		this.authLink    = "https://www.steamgifts.com/?login";
		this.wonsUrl     = "https://www.steamgifts.com/giveaways/won";

		this.settings.min_level      = { type: 'number', trans: this.transPath('min_level'), min: 0, max: 10, default: this.getConfig('min_level', 0) };
		this.settings.points_reserve = { type: 'number', trans: this.transPath('points_reserve'), min: 0, max: 500, default: this.getConfig('points_reserve', 0) };
        this.settings.min_cost       = { type: 'number', trans: this.transPath('min_cost'), min: 0, max: this.getConfig('max_cost', 0), default: this.getConfig('min_cost', 0) };
        this.settings.max_cost       = { type: 'number', trans: this.transPath('max_cost'), min: this.getConfig('min_cost', 0), max: 300, default: this.getConfig('max_cost', 0) };

		this.settings.wishlist_only   = { type: 'checkbox', trans: this.transPath('wishlist_only'), default: this.getConfig('wishlist_only', false) };
		this.settings.reserve_on_wish = { type: 'checkbox', trans: this.transPath('reserve_on_wish'), default: this.getConfig('reserve_on_wish', false) };
		this.settings.ignore_on_wish  = { type: 'checkbox', trans: this.transPath('ignore_on_wish'), default: this.getConfig('ignore_on_wish', false) };

		this.giveaways = [];

		super.init();
	}

	getUserInfo(callback){
		let userData = {
			avatar: 'https://cdn.steamgifts.com/img/favicon.ico',
			username: 'SG User',
			value: 0
		};

		$.ajax({
			url: 'https://www.steamgifts.com/account/settings/profile',
			success: function(data){
				data = $(data);

				userData.avatar   = data.find('.nav__avatar-inner-wrap').attr('style').replace('background-image:url(', '').replace(');', '');
				userData.username = data.find('input[name=username]').val();
				userData.value    = data.find('.nav__points').text();
			},
			complete: function () {
				callback(userData);
			}
		})

	}

	seekService(){
		let page  = 1;
		this.giveaways = [];

		let commonEntries = () => {
			if( !this.started )
				return;

			if ( page <= this.getConfig('pages', 1) )
				this.giveawaysFromUrl('https://www.steamgifts.com/giveaways/search?page=' + page, commonEntries);
			else
				this.giveawaysEnter();

			page++;
		};

		// Список желаемого
		this.giveawaysFromUrl('https://www.steamgifts.com/giveaways/search?type=wishlist', () => {
			if( this.getConfig('wishlist_only') )
				return;

			this.giveawaysEnter();

			this.giveaways = [];

            commonEntries();
		});
	}

	giveawaysFromUrl(url, callback){
		let _this = this;
		let wishlist = url.indexOf('wishlist') > 0;

		$.ajax({
			url: url,
			method: 'get',
			success: (data) => {
				data = $('<div>' + data + '</div>');

				let token = data.find('input[name="xsrf_token"]').val();

				if( token.length < 10 ){
					_this.log(this.trans('token_error'), true);
					_this.stopSeeker(true);
					return;
				}

				data.find('.giveaway__row-outer-wrap').each((index, item) => {
					let giveaway = $(item);
					let link = 'https://www.steamgifts.com' + giveaway.find('a.giveaway__heading__name').attr('href');

					_this.giveaways.push({
						wishlist: wishlist,
						pinned: giveaway.closest('.pinned-giveaways__outer-wrap').length > 0,
						link: link,
						code: link.match(/away\/(.*)\//)[1],
						name: giveaway.find('a.giveaway__heading__name').text(),
						level: giveaway.find('.giveaway__column--contributor-level').length > 0 ? parseInt(giveaway.find('.giveaway__column--contributor-level').text().replace('+', '').replace('Level ', '')) : 0,
						cost: parseInt(giveaway.find('a.giveaway__icon[rel]').prev().text().replace('(','').replace('P)', '')),
						entered: giveaway.find('.giveaway__row-inner-wrap.is-faded').length > 0
					});
				});
			},
			complete: () => {
				if( callback )
					callback();
			}
        });
	}

	giveawaysEnter(){
		let _this = this;
		let curr_giveaway = 0;

		function giveawayEnter(){
			if( giveaways.length <= curr_giveaway || !_this.started ){

				if( callback )
					callback();

				return;
			}

			let next_after = _this.interval();
			let giveaway = giveaways.eq(curr_giveaway),
				pinned   = giveaway.closest('.pinned-giveaways__outer-wrap').length > 0,
				link     = 'https://www.steamgifts.com' + giveaway.find('a.giveaway__heading__name').attr('href'),
				code     = link.match(/away\/(.*)\//)[1],
				name     = giveaway.find('a.giveaway__heading__name').text(),
				level    = giveaway.find('.giveaway__column--contributor-level').length > 0 ? parseInt(giveaway.find('.giveaway__column--contributor-level').text().replace('+', '').replace('Level ', '')) : 0,
				cost     = parseInt(giveaway.find('a.giveaway__icon[rel]').prev().text().replace('(','').replace('P)', '')),
				entered  = giveaway.find('.giveaway__row-inner-wrap.is-faded').length > 0;

			//_this.log(name + ', level - ' + level + ', cost - ' + cost + ', wishlist - ' + wishlist + ', pinned - ' + pinned);

			if( //true === false && ///////
				!entered && // Не участвую в розыгрыше
				( !wishlist || !pinned ) && // не вступать в закреплённые со страницы вишиста
				_this.curr_value >= cost && // Имеется необходимое кол-во очков
				( ( wishlist && _this.getConfig('ignore_on_wish') ) || _this.getConfig('min_level') === 0 || level >= _this.getConfig('min_level') ) && // Минимальный уровень
				( ( wishlist && _this.getConfig('ignore_on_wish') ) || cost >= _this.getConfig('min_cost') ) && // Минимальная стоимость
				( ( wishlist && _this.getConfig('ignore_on_wish') ) || _this.getConfig('max_cost') === 0 || cost <= _this.getConfig('max_cost') ) && // Максимальная стоимость
				( ( wishlist && _this.getConfig('reserve_on_wish') ) || _this.getConfig('points_reserve') === 0 || ( (_this.curr_value - cost) >= _this.getConfig('points_reserve') ) ) // Резерв очков
			)
			{
				$.ajax({
					url: 'https://www.steamgifts.com/ajax.php',
					method: 'post',
					dataType: 'json',
					data: {
						xsrf_token: token,
						do: 'entry_insert',
						code: code
					},
					success: function(data){
						if(data.type === 'success'){
							_this.log(Lang.get('service.entered_in') + _this.logLink(link, name) + '. ' + _this.trans('cost') + ' - ' + cost);
							_this.setValue(data.points);
						}
					}
				});
			}
			else
				next_after = 50;

			curr_giveaway++;
			setTimeout(giveawayEnter, next_after);
		}

		giveawayEnter();
	}
}