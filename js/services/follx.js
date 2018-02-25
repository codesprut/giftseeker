'use strict';

class Follx extends Seeker {

	constructor() {
		super();

		this.websiteUrl  = 'https://follx.com';
		this.authLink    = 'https://follx.com/logIn';
		this.wonsUrl     = 'https://follx.com/giveaways/won';

		this.authContent = '/account';
		this.pointsLabel = 'Energy';

		this.neededCookies.push('follx_session');

		super.init();
	}

	seekService(){
		let _this = this;
		let page  = 1;

		$.get('https://follx.com/giveaways?page=' + page, function (html) {
			console.log(html);

			$(html).find('.giveaway_card').each(function () {
				let link = $(this).find('a.game_name').attr('href'),
					name = $(this).find('a.game_name > span').text(),
					have = $(this).find('.giveaway-indicators > .have').length > 0,
					entered = $(this).find('entered').length > 0;

				if( !have && !entered ){
					$.get(link, function (html) {
						if( html.indexOf('data-action="enter"') > 0 ){
							$.ajax({
								method: 'post',
								url: link + '/action',
								data: 'action=enter',
								dataType: 'json',
								headers: {'X-Requested-With': 'XMLHttpRequest'},
								success: function (data) {
									if(data.response)
										_this.log('Вступил в ' + name);
								}
							})
						}
					});
				}
			});

		});
	}

}