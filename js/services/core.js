'use strict';

class Seeker {

	constructor() {
		this.intervalVar = undefined;
		this.doInterval  = this.getConfig('interval', 300);
		this.totalTicks = 0;

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

		if( Config.get('autostart') )
			this.startSeeker();
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

		$('<ul><li class="active" data-id="logs" data-lang="service.logs">' + Lang.get('service.logs') +'</li><li data-id="settings" data-lang="service.settings">' + Lang.get('service.settings') + '</li></ul>')
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
			.attr('data-lang', 'service.open_website')
			.text(Lang.get("service.open_website"))
			.click(() => {
				Browser.loadURL(this.websiteUrl);
				Browser.show();
				Browser.setTitle('GS Browser - ' + Lang.get('auth.browser_loading'));
			}).appendTo(this.userPanel);

		this.mainButton = $('<button>' + Lang.get('service.btn_start') + '</button>')
			.addClass('seeker-button start-button')
			.hover(() => {
				this.mainButton.addClass('hovered');
				if( this.started )
					this.buttonState(Lang.get('service.btn_stop'));
			}, () => {
				this.mainButton.removeClass('hovered');
				if( this.started )
					this.buttonState(window.timeToStr(this.doInterval - this.totalTicks % this.doInterval));
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

		this.buttonState(Lang.get('service.btn_checking'), 'disabled');

		this.authCheck( (authState) => {
			if ( authState === 1)
				this.runTimer();
			else if( authState === -1 ){
				this.log(Lang.get('service.connection_error'), true);
				this.buttonState(Lang.get('service.btn_start'));
			}
			else {
				this.waitAuth = true;

				Browser.webContents.on('did-finish-load', () => {
					if( this.waitAuth && Browser.getURL().indexOf(this.websiteUrl) >= 0 ){
						Browser.webContents.executeJavaScript('document.querySelector("body").innerHTML', (body) => {
							if( body.indexOf(this.authContent) >= 0 ){
								Browser.close();
								this.waitAuth = false;
							}
						});
					}
				});

				Browser.loadURL(this.authLink);

				Browser.once('close', () => {
					Browser.webContents.removeAllListeners('did-finish-load');

					this.waitAuth = false;
					this.authCheck((authState) => {
						if ( authState === 1)
							this.runTimer();
						else
							this.buttonState(Lang.get('service.btn_start'));
					});
				});
				Browser.show();
			}
		});

	}

	stopSeeker(){
		if( !this.started )
			return false;

		this.started = false;
		clearInterval(this.intervalVar);

		this.log(Lang.get('service.stopped'));
		this.buttonState(Lang.get('service.btn_start'));
	}

	runTimer(){
		this.totalTicks = 0;
		this.started = true;
		this.log(Lang.get('service.started'));

		if( this.intervalVar )
			clearInterval(this.intervalVar);

		this.intervalVar = setInterval(() => {
			if( !this.started )
				clearInterval(this.intervalVar);

			if( this.totalTicks % this.doInterval === 0 )
				this.seekService();

			if( !this.mainButton.hasClass('hovered') )
				this.buttonState(window.timeToStr(this.doInterval - this.totalTicks % this.doInterval));

			this.totalTicks++;
		}, 1000);
	}

	buttonState(text, className){
		this.mainButton.removeClass('disabled').text(text);
		if( className )
			this.mainButton.addClass(className);
	}

	getConfig(key, def){
		return Config.get(this.constructor.name + '_' + key, def);
	}

	setConfig(key, val){
		return Config.set(this.constructor.name + '_' + key, val);
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