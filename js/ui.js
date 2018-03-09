'use strict';
const remote = require('electron').remote;

let Config = remote.getGlobal('Config');
let Lang   = remote.getGlobal('Lang');
let user   = remote.getGlobal('user');

let Browser     = remote.getGlobal('Browser');
let authWindow  = remote.getGlobal('authWindow');
let mainWindow  = remote.getGlobal('mainWindow');

$(function(){
	// Основной воркер главного окна
	intervalSchedules();

	// UI LOAD
	reloadLangStrings();
	loadUser();

	// Восстановление сохранённых настроек
	let setters = $('.setter').each(function(){
		let item = $(this);

		switch(item.attr('type')){
			case 'checkbox':
				item.prop('checked', Config.get(item.attr('id')));
				break;
		}
	});

	let lang_select = $('select#lang');
	for(let lang in Lang.list()){
		let option = $(document.createElement('option'))
			.val(lang).text('[' + Lang.list()[lang].lang_culture + '] ' + Lang.list()[lang].lang_name);

		if( Config.get('lang') === lang )
			option.prop('selected', true);

		lang_select.append(option);
	}

	// Переключение типа отображения иконок сервисов
	let menu_switcher = $('.list_type');
	if( Config.get("menu_as_list") )
		menu_switcher.addClass('state');


	// Смена окон по окончании рендеринга
	authWindow.hide();
	mainWindow.show();


	// EVENTS

	// Управление окном
	$('.window-buttons span').click(function () {
		if($(this).hasClass('minimizer'))
			remote.BrowserWindow.getFocusedWindow().minimize();
		else
			window.close();
	});

	menu_switcher.click(function () {
		$(this).toggleClass('state');

		Config.set("menu_as_list", $(this).hasClass('state'));
	});

	// Переключение основных пунктов меню
	$('.menu li span').click(function(){
		let parent = $(this).parent();
		$('.menu li, .content-item').removeClass('active');

		parent.add('.content-item[data-id="' + parent.attr('data-id') + '"]').addClass('active');
	});

	// Переключение вкладок внутри сервиса - переключаем сразу во всех сервисах
	$(document).on('click', '.service-panel > ul li', function() {
		$('.service-panel > ul li, .in-service-panel').removeClass('active');
		$('.in-service-panel[data-id="' + $(this).attr('data-id') + '"]')
			.add('.service-panel > ul li[data-id="' + $(this).attr('data-id') + '"]').addClass('active');
	});

	// Клик по кнопке выхода из авторизованного аккаунта
	$('.seeker-button.logout').click(function () {
		let clicked = $(this).addClass('disabled');

		$.ajax({
			method: 'get',
			url: 'http://giftseeker.ru/logout',
			success: function () {
				mainWindow.hide();
				mainWindow.loadURL(__dirname + '/blank.html');

				authWindow.show();
			},
			error: function () {
				clicked.removeClass('disabled');
				alert('something went wrong...');
			}
		});
	});

	// Изменение настроек
	setters.change(function () {
		let changed = $(this);
		let value   = changed.val();

		switch(changed.attr('type')){
			case 'checkbox':
				value = changed.prop('checked');
				break;
		}

		Config.set(changed.attr('id'), value);

		if( changed.attr('id') === 'lang' ){
			reloadLangStrings();
		}
	});
});

function intervalSchedules(){
	// Обновлять инфо о юзере
}

function reloadLangStrings() {
	$('[data-lang]').each(function(){
		$(this).html(Lang.get($(this).attr('data-lang')));
	});

	$('[data-lang-title]').each(function(){
		$(this).attr('title', Lang.get($(this).attr('data-lang-title')));
	})
}

function loadUser() {
	let block = $('.content-item .info');
	let avatar = $(document.createElement('div'))
		.addClass('avatar').css({'background-image': 'url("' + user.avatar + '")'});
	let username = $(document.createElement('div'))
		.addClass('username').html(user.username);

	block.append(avatar)
		.append(username);
}