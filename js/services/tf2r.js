'use strict';

class TF2R extends Seeker {

	constructor() {
		super();

		this.domain      = 'tf2r.com';
		this.websiteUrl  = 'http://tf2r.com';
		this.authContent = 'Notifications';
		this.authLink    = "http://tf2r.com/login";
		this.wonsUrl     = "http://tf2r.com/notifications.html";
		this.withValue   = false;
        this.getTimeout  = 10000;

		super.init();
	}

	authCheck(callback){
		let authContent = this.authContent;

		this.ajaxReq(this.websiteUrl, (response) => {
			if(response.success){
				if( response.data.indexOf( authContent ) >= 0 )
					callback(1);
				else
					callback(0);
			}
			else
				callback(-1);
		});
	}

	getUserInfo(callback){

		let userData = {
			avatar: 'http://tf2r.com/favicon.ico',
			username: 'TF2R user'
		};

		this.ajaxReq('http://tf2r.com/notifications.html', (response) => {
			if(response.success){
				userData.username = $(response.data).find('#nameho').text();
				userData.avatar   = $(response.data).find('#avatar a img').attr('src');
			}

			callback(userData);
		});
	}

	seekService(){
		let _this = this;

		_this.ajaxReq('http://tf2r.com/raffles.html', (response) => {
			let giveaways = $(response.data).find('.pubrhead-text-right');
			let curr_giveaway = 0;

			function giveawayEnter(){
				if( giveaways.length <= curr_giveaway || !_this.started )
					return;

				let giveaway = giveaways.eq(curr_giveaway),
					link     = giveaway.find('a').attr('href'),
					name     = giveaway.find('a').text();

				_this.ajaxReq(link, (response) => {
					if( response.success ){
						let html = $('<div>' + response.data + '</div>');
						let entered = html.find('#enbut').length === 0;

						if( entered || response.data.indexOf('Fuck off') >= 0 )
							return;

						Request({
							method: 'POST',
							uri: "http://tf2r.com/job.php",
							form: {
								enterraffle: "true",
								rid: link.replace('http://tf2r.com/k', '').replace('.html', ''),
								ass: "yup, indeed"
							},
							headers: {
								'User-Agent': mainWindow.webContents.session.getUserAgent(),
								Cookie: _this.cookies
							},
							json: true
						})
						.then(function (body) {
							if(body.status === "ok")
								_this.log(Lang.get('service.entered_in') + name);
						});
					}
				});

				curr_giveaway++;
				setTimeout(giveawayEnter, (_this.getConfig('interval') * 1000 ));
			}

			giveawayEnter();
		});
	}


	ajaxReq(url, callback){
		let response = {
			success: false,
			data: ''
		};

		$.ajax({
			url: url,
			timeout: this.getTimeout,
			success: function (html) {
				response.success = true;
				response.data = html;
			},
			error: function (error) {
				if( error.responseText !== undefined && error.responseText.indexOf('!DOCTYPE') >= 0 ){
					response.success = true;
					response.data = error.responseText;
				}
			},
			complete: function(){
				callback(response);
			}
		});
	}

}