'use strict';

class Seeker {

	constructor() {
		this.intervalVar = undefined;
		this.doInterval  = 300;
		this.totalTickes = 0;

		this.Browser     = require('electron').remote.getGlobal('Browser');

		this.started     = false;
		this.waitAuth    = false;

		this.websiteUrl  = 'http://giftseeker.ru';
		this.authLink    = 'http://giftseeker.ru';
		this.wonsUrl     = 'http://giftseeker.ru';
		this.authContent = '';
		this.pointsLabel = 'Points';

		this.points      = 0;
		this.getTimeout  = 15000;

		this.neededCookies = [];
	}

	init(){
		this.addIcon();
		this.addPanel();

		// Нужно удостовериться что ивент не навешивается каждый раз
		this.Browser.webContents.on('did-finish-load', () => {
			if( this.waitAuth && this.Browser.getURL().indexOf(this.websiteUrl) >= 0 ){
				this.Browser.webContents.executeJavaScript('document.querySelector("body").innerHTML', (body) => {
					if( body.indexOf(this.authContent) >= 0 ){
						this.Browser.close();
						this.waitAuth = false;
					}
				});
			}
		});
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

		this.openWebsiteLink = $(document.createElement('button'))
			.addClass('open-website')
			.text('На сайт')
			.click(() => {
				this.Browser.loadURL(this.websiteUrl);
				this.Browser.show();
				this.Browser.setTitle('GS Browser - загрузка');
			}).appendTo(this.userPanel);

		this.mainButton = $('<button>Старт</button>')
			.addClass('seeker-button')
			.hover(() => {
				this.mainButton.addClass('hovered');
				if( this.started )
					this.buttonState('Стоп');
			}, () => {
				this.mainButton.removeClass('hovered');
				if( this.started )
					this.buttonState(window.timeToStr(this.doInterval - this.totalTickes % this.doInterval));
			})
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


	authCheck(callback){
		let authContent = this.authContent;

		$.ajax({
			url: this.websiteUrl,
			timeout: this.getTimeout,
			success: function (html) {
				if( html.indexOf( authContent ) >= 0 )
					callback(1);
				else
					callback(0);
			},
			error: function () {
				callback(-1);
			}
		});
	}

	startSeeker(){
		if( this.started )
			return false;

		this.buttonState('Проверка...', 'disabled');

		this.authCheck( (authState) => {
			if ( authState === 1)
				this.runTimer();
			else if( authState === -1 ){
				this.log('Ошибка соединения с сервисом...', true);
				this.buttonState('Старт');
			}
			else {
				this.waitAuth = true;

				this.Browser.loadURL(this.authLink);
				this.Browser.once('close', () => {
					this.waitAuth = false;
					this.authCheck((authState) => {
						if ( authState === 1)
							this.runTimer();
						else
							this.buttonState('Старт');
					});
				});
				this.Browser.show();
			}
		});

	}

	stopSeeker(){
		if( !this.started )
			return false;

		this.started = false;
		clearInterval(this.intervalVar);

		this.log('Бот остановлен');
		this.buttonState('Старт');
	}

	runTimer(){
		this.totalTickes = 0;
		this.started = true;
		this.log('Бот запущен');

		if( this.intervalVar )
			clearInterval(this.intervalVar);

		this.intervalVar = setInterval(() => {
			if( !this.started )
				clearInterval(this.intervalVar);

			if( this.totalTickes % this.doInterval == 0 )
				this.seekService();

			if( !this.mainButton.hasClass('hovered') )
				this.buttonState(window.timeToStr(this.doInterval - this.totalTickes % this.doInterval));

			this.totalTickes++;
		}, 1000);
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

	// Виртуальные функции - реализуются в потомках
	seekService(){}
}