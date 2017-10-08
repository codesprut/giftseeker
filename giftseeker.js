'use strict';
const {app, BrowserWindow} = require('electron');

let mainWindow;
let Browser;

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});


app.on('ready', function() {
	mainWindow = new BrowserWindow({
		width: 730,
		height: 500,
		title: 'GiftSeeker',
		//icon: '',
		show: false,
		center: true,
		resizable: false,
		frame: false
	});

	mainWindow.setMenu(null);

	mainWindow.loadURL('file://' + __dirname + '/index.html');

	//mainWindow.webContents.openDevTools();

	//### Работа над окном браузера для сайтов

	Browser =  new BrowserWindow({
		parent: mainWindow,
		title: 'GS Browser',
		width: 1000,
		height: 600,
		modal: true,
		show: false,
		center: true,
		resizable: false,
		webPreferences: {
			nodeIntegration: false
		}
	});

	Browser.setMenu(null);

	Browser.on('close', (e) => {
		e.preventDefault();
		Browser.hide();

		mainWindow.focus();
	});


	// Линк на браузер в глобальное пространство
	global.Browser = Browser;

	//### Конец работы с браузером для сайтов


	mainWindow.on('ready-to-show', function() {
		mainWindow.show();
		mainWindow.focus();
	});

	mainWindow.on('closed', function(e) {
		mainWindow = null;
	});
});
