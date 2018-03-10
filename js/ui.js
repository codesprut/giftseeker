'use strict';
const remote = require('electron').remote;
const ipc    = require("electron").ipcRenderer;

let Config = remote.getGlobal('Config');
let Lang   = remote.getGlobal('Lang');
let GSuser = remote.getGlobal('user');

let Browser     = remote.getGlobal('Browser');
let authWindow  = remote.getGlobal('authWindow');
let mainWindow  = remote.getGlobal('mainWindow');

$(function(){
	// Основной воркер главного окна
	intervalSchedules();

	// UI LOAD
	reloadLangStrings();
	profileSection();

	// Восстановление сохранённых настроек
	let setters = $('.settings .setter').each(function(){
		let item = $(this);

		switch(item.attr('type')){
			case 'checkbox':
				item.prop('checked', Config.get(item.attr('id')));
				break;
		}
	});

	// Переключение типа отображения иконок сервисов
	let menu_switcher = $('.list_type');
	if( Config.get("menu_as_list") )
		menu_switcher.addClass('state');


	// Смена окон по окончании рендеринга
	authWindow.hide();
    mainWindow.show();

	if( Config.get('start_minimized') )
        mainWindow.hide();
    else
        mainWindow.focus();


	// EVENTS

	// Управление окном
	$('.window-buttons span').click(function () {
		if($(this).hasClass('minimizer'))
			remote.BrowserWindow.getFocusedWindow().hide();
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

                ipc.send('save-user', null);
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

		if( changed.attr('id') === 'lang' ){
			ipc.send('change-lang', value);
			return;
		}

		Config.set(changed.attr('id'), value);
	});

	ipc.on('change-lang', function(){
		reloadLangStrings();
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

function profileSection() {
    // Отрисовка пользователя
	let block = $('.content-item .info');
	let avatar = $(document.createElement('div'))
		.addClass('avatar').css({'background-image': 'url("' + GSuser.avatar + '")'});
	let username = $(document.createElement('div'))
		.addClass('username').html(GSuser.username);

	block.append(avatar)
		.append(username);

    let lang_select = $('select#lang');
    let lang_list	= Lang.list();

    $('.build .version').text(currentBuild);

    // Наполняем языковой селект, либо удаляем его
    if( Lang.count() <= 1 )
        lang_select.remove();
    else{
        for(let lang in lang_list){
            let option = $(document.createElement('option'))
	            .attr('id', lang_list[lang].lang_culture)
                .val(lang).text('[' + lang_list[lang].lang_culture + '] ' + lang_list[lang].lang_name);

            if( Config.get('lang') === lang )
                option.prop('selected', true);

            lang_select.append(option);
        }
    }


    // Ссылки внизу
    let info_links = $('.content-item .info-links');

    $(document.createElement('button'))
        .addClass('open-website')
        .text('GiftSeeker.RU')
        .click(() => {
            openWebsite('http://giftseeker.ru/');
        }).appendTo(info_links);

    $(document.createElement('button'))
        .addClass('open-website')
        .attr('data-lang', 'profile.donation')
        .text(Lang.get('profile.donation'))
        .css('margin-left', '7px')
        .click(() => {
            openWebsite('http://giftseeker.ru/donation');
        }).appendTo(info_links);

    $(document.createElement('button'))
        .addClass('open-website')
        .attr('data-lang', 'profile.forum')
        .text(Lang.get('profile.forum'))
        .css('margin-left', '7px')
        .click(() => {
            openWebsite('http://iknows.ru/forums/gs/');
        }).appendTo(info_links);

    $(document.createElement('br')).appendTo(info_links);
    $(document.createElement('span'))
        .attr('data-lang', 'profile.translated_by')
        .text(Lang.get('profile.translated_by'))
        .appendTo(info_links);

    $(document.createElement('button'))
        .addClass('open-website')
        .attr('data-lang', 'translator')
        .text(Lang.get('translator'))
        .css('margin-left', '7px')
        .click(() => {
            openWebsite(Lang.get('feedback_url'));
        }).appendTo(info_links);
}

function openWebsite(url){
    Browser.loadURL(url);
    Browser.show();
    Browser.setTitle('GS Browser - ' + Lang.get('auth.browser_loading'));
}