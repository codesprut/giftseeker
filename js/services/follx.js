'use strict';

class Follx extends Seeker {

	constructor() {
		super();

		this.websiteUrl  = 'https://follx.com';
		this.authLink    = 'https://follx.com/logIn';
		this.wonsUrl     = 'https://follx.com/giveaways/won';

		this.authContent = '/account';
		this.pointsLabel = 'Energy';

		this.neededCookies.push('Follx');

		super.init();
	}

	seekService(){
		let _this = this;
		let page  = 1;

		$.get('https://follx.com/?page=' + page, function (html) {

			$(html).find('.giveawayCard').each(function () {
				let id = $(this).find('a.link').attr('href').replace('https://follx.com/giveaway/', ''),
					name = $(this).find('a.link span+span').text(),
					have = $(this).find('.fa-bars').length > 0,
					entered = $(this).hasClass('entered');

				if( !have && !entered ){
					$.get('https://follx.com/giveaway/' + id, function (html) {
						if( html.indexOf('data-action="enter"') > 0 ){
							$.ajax({
								method: 'post',
								url: 'https://follx.com/giveaways/' + id + '/action',
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