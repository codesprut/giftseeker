'use strict';
const {app, BrowserWindow} = require('electron');

let authWindow;
let mainWindow;
let Browser;

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});


app.on('ready', function() {
	authWindow = new BrowserWindow({
		width: 280,
		height: 340,
		title: 'GiftSeeker',
		//icon: '',
		show: false,
		center: true,
		resizable: false,
		frame: false
	});

	authWindow.setMenu(null);

	authWindow.loadURL('file://' + __dirname + '/auth.html');



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

	authWindow.webContents.openDevTools();


	//### Browser for websites

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

		if(mainWindow.hidden)
			authWindow.focus();
		else
			mainWindow.focus();
	});

	//### end browser for websites



	authWindow.on('ready-to-show', function() {
		authWindow.show();
		authWindow.focus();
	});

	mainWindow.on('ready-to-show', function() {
		authWindow.hide();
		mainWindow.show();
		mainWindow.focus();
	});

	authWindow.on('close', function(e){
		authWindow.removeAllListeners('close');
		mainWindow.close();
	});

	mainWindow.on('close', function(e){
		mainWindow.removeAllListeners('close');
		authWindow.close();
	});

	authWindow.on('closed', function(e) {
		authWindow = null;
	});

	mainWindow.on('closed', function(e) {
		mainWindow = null;
	});

	// Ссылки в глобальное пространство
	global.mainWindow = mainWindow;
	global.authWindow = authWindow;
	global.Browser = Browser;
});
