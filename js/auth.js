'use strict';

const remote = require('electron').remote;
const ipc    = require("electron").ipcRenderer;

let Lang = remote.getGlobal('Lang');
let authWindow  = remote.getGlobal('authWindow');
let mainWindow  = remote.getGlobal('mainWindow');
let Browser     = remote.getGlobal('Browser');

let status  = $('.status-text');
let buttons = $('.seeker-button');


$(function(){
	// Управление окном
	$('.window-buttons span').click(function () {
		if($(this).hasClass('minimizer'))
			require('electron').remote.BrowserWindow.getFocusedWindow().hide();
		else
			window.close();
	});

	// -------------------------------

	reloadLangStrings();

	$('#auth_button').click(function(e){
		e.preventDefault();

		Browser.loadURL('http://giftseeker.ru/logIn');
		Browser.show();
		Browser.setTitle('GS Browser - ' + Lang.get('auth.browser_loading'));


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

authWindow.on('show', function(){
	checkAuth();
});

function checkAuth() {
	buttons.addClass('disabled');
	status.text(Lang.get('auth.check'));

	$.ajax({
		url: 'http://giftseeker.ru/api/userData',
		dataType: 'json',
		success: function (data) {
			if( !data.response ){
				status.text( Lang.get('auth.ses_not_found') );
				buttons.removeClass('disabled');
				return;
			}

			ipc.send('save-user', data.response);

			status.text(Lang.get('auth.session') + data.response.username);

			loadProgram();
		},
		error: function(error){
			status.text(Lang.get('auth.connection_error'));
			buttons.removeClass('disabled');
		}
	});
}

function loadProgram(){
	mainWindow.loadURL('file://' + __dirname + '/index.html');
}

function reloadLangStrings() {
	$('[data-lang]').each(function(item, index){
		$(this).html(Lang.get($(this).attr('data-lang')));
	})
}