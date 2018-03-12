'use strict';

class IndieGala extends Seeker {

	constructor() {
		super();

		this.authContent = "My Libraries";

		this.websiteUrl  = "https://www.indiegala.com";
		this.authLink    = "https://www.indiegala.com/login";
		this.wonsUrl     = "https://www.indiegala.com/profile";

		super.init();
	}

	authCheck(callback){
		$.ajax({
			url: 'https://www.indiegala.com/get_user_info',
			dataType: 'json',
			success: function (data) {
				if( data.steamnick )
					callback(1);
				else
					callback(0);
			},
			error: function () {
				callback(-1);
			}
		});
	}

	getUserInfo(callback){
		let userData = {
			avatar: 'https://www.indiegala.com/favicon.ico',
			username: 'IG User',
			value: 0
		};

		$.ajax({
			url: 'https://www.indiegala.com/get_user_info',
			data: {
				uniq_param: (new Date()).getTime(),
				show_coins: 'True'
			},
			dataType: 'json',
			success: function(data){
				userData.avatar   = data.steamavatar;
				userData.username = data.steamnick;
				userData.value    = data.silver_coins_tot;

			},
			complete: function(){
				callback(userData);
			}
		});
	}

	seekService(){
		let _this = this;
		let page  = 1;

		$.get('https://www.indiegala.com/giveaways/get_user_level_and_coins', function(data){
			data = JSON.parse(data);
			if(data.status !== 'ok')
				return;
			let user_level = data.current_level;

			$.get('https://www.indiegala.com/giveaways/ajax_data/list?page_param=' + page + '&order_type_param=expiry&order_value_param=asc&filter_type_param=level&filter_value_param=all', function(data){
				let tickets = $(JSON.parse(data).content).find('.tickets-col');

				let curr_ticket = 0;

				function giveawayEnter(){
					if( tickets.length <= curr_ticket || !_this.started )
						return;

					let next_after = (_this.getConfig('interval') * 1000 );
					let ticket = tickets.eq(curr_ticket),
						id     = ticket.find('.ticket-right .relative').attr('rel'),
						price  = ticket.find('.ticket-price strong').text(),
						level  = parseInt(ticket.find('.type-level span').text().replace('+', '')),
						name   = ticket.find('h2 a').text(),
						single = ticket.find('.extra-type .fa-clone').length === 0,
						entered  = false,
						enterTimes = 0;

					if( single )
						entered = ticket.find('.giv-coupon').length === 0;
					else {
						enterTimes = parseInt(ticket.find('.giv-coupon .palette-color-11').text());
						entered = enterTimes > 0;
					}

					if( entered || user_level < level )
						next_after = 50;
					else
					{
						$.ajax({
							type: "POST",
							url: 'https://www.indiegala.com/giveaways/new_entry',
							contentType: "application/json; charset=utf-8",
							dataType: "json",
							data: JSON.stringify({ giv_id: id, ticket_price: price }),
							success: function(data){
								if( data.status === 'ok' ){
									_this.setValue(data.new_amount);
									_this.log(Lang.get('service.entered_in') + name);
								}
							}
						});
					}

					curr_ticket++;
					setTimeout(giveawayEnter, next_after);
				}

				giveawayEnter();
			});

		});
	}

}