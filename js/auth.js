'use strict';

let mainWindow;
let Browser;
let status;
let buttons;

$(function(){
	// Управление окном
	$('.window-buttons span').click(function () {
		if($(this).hasClass('minimizer'))
			require('electron').remote.BrowserWindow.getFocusedWindow().minimize();
		else
			window.close();
	});

	let session = require('electron').remote.session;
	let ses = session.defaultSession.cookies;

	ses.get({}, function(error, cookies) {
		console.dir(cookies);
		if (error) {
			console.dir(error);
		}
	});

	mainWindow = require('electron').remote.getGlobal('mainWindow');
	Browser = require('electron').remote.getGlobal('Browser');
	status  = $('.status-text');
	buttons = $('.seeker-button');

	// -------------------------------

	checkAuth();


	$('#auth_button').click(function(e){
		e.preventDefault();

		Browser.loadURL('http://giftseeker.ru/logIn');
		Browser.show();
		Browser.setTitle('GS Browser - загрузка');


		Browser.webContents.on('did-finish-load',  () => {
			if( Browser.getURL() === 'http://giftseeker.ru/'){
				Browser.webContents.executeJavaScript('document.querySelector("body").innerHTML', (body) => {
					if( body.indexOf('/account') >= 0 ){
						Browser.webContents.removeAllListeners('did-finish-load');
						Browser.close();
						checkAuth();
					}
				});
			}
		});
	});

});

function checkAuth() {
	buttons.addClass('disabled');
	status.text('Проверка авторизации..');

	$.ajax({
		url: 'http://giftseeker.ru/api/userData',
		dataType: 'json',
		success: function (data) {
			if( !data.response ){
				status.text('Сессия не найдена');
				return;
			}

			status.text('Сессия ' + data.response.username);

			loadProgram();
		},
		error: function(error){
			status.text('Ошибка соединения');
		},
		complete: function () {
			buttons.removeClass('disabled');
		}
	});
}

function loadProgram(){
	mainWindow.loadURL('file://' + __dirname + '/index.html');
}