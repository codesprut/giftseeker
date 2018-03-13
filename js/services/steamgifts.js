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
		this.settings.max_cost       = { type: 'number', trans: this.transPath('max_cost'), min: 0, max: 300, default: this.getConfig('max_cost', 0) };

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
		let _this = this;

		$.get('https://www.steamgifts.com/', (data) => {

			data = $('<div>' + data + '</div>');

			let token = data.find('input[name="xsrf_token"]').val();

			if( token.length < 10 ){
				_this.log(this.trans('token_error'), true);
				_this.stopSeeker(true);
				return;
			}

			let giveaways = data.find('.giveaway__row-outer-wrap');
			let curr_giveaway = 0;

			function giveawayEnter(){
				if( giveaways.length <= curr_giveaway || !_this.started )
					return;

				let next_after = (_this.getConfig('interval') * 1000 );
				let giveaway = giveaways.eq(curr_giveaway),
					code     = giveaway.find('a.giveaway__heading__name').attr('href').match(/away\/(.*)\//)[1],
					name     = giveaway.find('a.giveaway__heading__name').text(),
					cost     = parseInt(giveaway.find('a.giveaway__icon[rel]').prev().text().replace('(','').replace('P)', '')),
					entered  = giveaway.find('.giveaway__row-inner-wrap.is-faded').length > 0;

				if( entered ||
					_this.curr_value < cost ||
					( _this.getConfig('max_cost') !== 0 && cost > _this.getConfig('max_cost') ) || // Максимальная стоимость
					( _this.getConfig('points_reserve') !== 0 && (_this.curr_value - cost) < _this.getConfig('points_reserve') ) // Резерв очков
				)
					next_after = 50;
				else
				{
					$.ajax({
						url: 'https://www.steamgifts.com/ajax_tmp.php',
						method: 'post',
						dataType: 'json',
						data: {
							xsrf_token: token,
							do: 'entry_insert',
							code: code
						},
						success: function(data){
							if(data.type === 'success'){
								_this.log(Lang.get('service.entered_in') + name + '. ' + _this.trans('cost') + ' - ' + cost);
								_this.setValue(data.points);
							}
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