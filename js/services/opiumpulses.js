'use strict';

class OpiumPulses extends Seeker {

	constructor() {
		super();

		this.websiteUrl  = 'http://www.opiumpulses.com';
		this.authContent = 'site/logout';
		this.authLink    = "https://www.opiumpulses.com/site/login";
		this.wonsUrl     = "http://www.opiumpulses.com/user/giveawaykeys";

		delete this.settings.pages;
		super.init();

		if(Lang.current() === 'ru_RU')
			this.log('В данный момент программа присоединяется только к бесплатным раздачам');
		else
			this.log('currently program let join to free giveaways');
	}

	getUserInfo(callback){
		let userData = {
			avatar: 'http://www.opiumpulses.com/assets/272b1d8c/v2/img/logo-fixed.png',
			username: 'OP user',
			value: 0
		};

		$.ajax({
			url: 'http://www.opiumpulses.com/user/account',
			success: function(data){
				data = $(data);

				userData.username = data.find('#User_username').val();
				userData.avatar = data.find('img.img-thumbnail').attr('src');
				userData.value = data.find('.points-items li a').first().text().replace('Points:', '').trim();

			},
			complete: function () {
				callback(userData);
			}
		});
	}

	seekService(){
		let _this = this;

		$.get('http://www.opiumpulses.com/giveaway/filterGiveaways?source=gf&pageSize=240&status=active&ajax=1', function(){
			$.get('http://www.opiumpulses.com/giveaways', function(data){


				let found_games = $(data).find('.giveaways-page-item');

				let curr_giveaway = 0;

				function giveawayEnter(){
					if( found_games.length <= curr_giveaway || !_this.started )
						return;

					let next_after = (_this.getConfig('interval') * 1000 );
					let giveaway = found_games.eq(curr_giveaway),
						name     = giveaway.find('.giveaways-page-item-footer-name').text().trim(),
						eLink     = giveaway.find('.giveaways-page-item-img-btn-enter').attr('href'),
						link     = giveaway.find('.giveaways-page-item-img-btn-more').attr('href'),
						cost     = parseInt(giveaway.find('.giveaways-page-item-header-points').text().replace('points', '').trim()),
						free     = isNaN(cost);

					if( !free )
						next_after = 50;
					else
					{
						$.get("http://www.opiumpulses.com" + link, function(data){
							let entered = data.indexOf("entered this giveaway") >= 0;

							if( entered )
								return;

							$.get("http://www.opiumpulses.com" + eLink, function(){
								_this.log(Lang.get('service.entered_in') + _this.logLink("http://www.opiumpulses.com" + link, name));
							});
						});
					}

					curr_giveaway++;
					setTimeout(giveawayEnter, next_after);
				}

				giveawayEnter();

			});
		});
	}

}