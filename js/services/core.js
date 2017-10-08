'use strict';

class Seeker {

	constructor() {
		const _this = this;
		this.Browser = require('electron').remote.getGlobal('Browser');

		this.started     = false;

		this.websiteUrl  = 'http://giftseeker.ru';
		this.authLink    = 'http://giftseeker.ru';
		this.authContent = '';
		this.pointsLabel = 'Points';

		this.points      = 0;
		this.getTimeout  = 15000;

		this.neededCookies = [];
	}

	init(){
		this.addIcon();
		this.addPanel();
	}

	addIcon(){
		this.icon = $(document.createElement('div'))
			.addClass('service-icon')
			.appendTo('.services-icons');

		$(document.createElement('div')).addClass('bg')
			.css({'background-image': "url('images/services/" + this.constructor.name + ".png')"})
			.appendTo(this.icon);

		$(document.createElement('span'))
			.addClass('service-name')
			.text(this.constructor.name)
			.appendTo(this.icon);

		this.icon.on('click', () => {
			this.setActive();
		});
	}

	addPanel(){
		this.panel = $(document.createElement('div'))
			.addClass('service-panel')
			.appendTo('.services-panels');

		$('<ul><li class="active" data-id="logs">Лог действий</li><li data-id="settings">Настройки</li></ul>')
			.appendTo(this.panel);

		this.logField = $(document.createElement('div'))
			.addClass('service-logs in-service-panel styled-scrollbar active')
			.attr('data-id', 'logs')
			.appendTo(this.panel);

		this.settingsPanel = $(document.createElement('div'))
			.addClass('service-settings in-service-panel')
			.attr('data-id', 'settings')
			.appendTo(this.panel);

		this.userPanel = $(document.createElement('div'))
			.addClass('service-user-panel')
			.appendTo(this.panel);

		this.mainButton = $('<button>Старт</button>')
			.addClass('seeker-button')
			.click(() => {
				if(this.mainButton.hasClass('disabled'))
					return;

				if( !this.started )
					this.startSeeker();
				else
					this.stopSeeker();
			})
			.appendTo(this.userPanel);
	}

	setActive(){
		$('.service-icon, .service-panel').removeClass('active');

		this.icon.addClass('active');
		this.panel.addClass('active');
	}


	authCheck(){
		let response = -1; // timeout
		let _this = this;

		$.ajax({
			url: this.websiteUrl,
			timeout: this.getTimeout,
			async: false,
			success: function (html) {
				response = 0;

				if( html.indexOf(_this.authContent) > 0 )
					response = 1;
			}
		});

		return response;
	}

	async startSeeker(){
		if( this.started )
			return false;

		this.buttonState('Проверка...', 'disabled');

		let authState = await this.authCheck();

		this.buttonState('Старт');

		if ( authState === 1){
			this.log('started');
			this.started = true;
			this.buttonState('Стоп');
		}
		else if( authState === -1 ){
			this.log('Ошибка соединения с сервисом...', true);
		}
		else {
			this.Browser.loadURL(this.authLink);
			this.Browser.webContents.openDevTools();
			this.Browser.show();
		}

	}

	stopSeeker(){
		if( !this.started )
			return false;

		this.started = false;
		this.buttonState('Старт');
	}

	buttonState(text, className){
		this.mainButton.removeClass('disabled').text(text);
		if( className )
			this.mainButton.addClass(className);
	}

	clearLog(){
		this.logField.html('<div><span class="time">' + timeStr() + ':</span>Лог очищен</div>');
	}

	log(text, logType){
		this.logField.append('<div class="' + (logType ? 'warn' : 'normal') + '"><span class="time">' + timeStr() + ':</span>' + text + '</div>');
	}
}