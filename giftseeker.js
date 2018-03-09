'use strict';
const {app, session, BrowserWindow, ipcMain} = require('electron');
const storage = require('electron-json-storage');
const fs = require('fs');

let authWindow;
let mainWindow;
let Browser;
let _session = null;
let Config   = null;
let Lang     = null;
let execPath = process.execPath.match(/.*\\/i)[0];

// for windows portable
if( process.env.PORTABLE_EXECUTABLE_DIR !== undefined )
	execPath = process.env.PORTABLE_EXECUTABLE_DIR + "\\";

storage.setDataPath(execPath + 'data');

ipcMain.on('save-user', function(event, data) {
	global.user = data;
});

app.on('window-all-closed', function() {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});


app.on('ready', function() {
	Config   = new ConfigClass();
	Lang     = new LanguageClass();
	_session = session.fromPartition('persist:GiftSeeker');

	authWindow = new BrowserWindow({
		width: 280,
		height: 340,
		title: 'GiftSeeker',
		icon: __dirname + '/icon.ico',
		show: false,
		center: true,
		resizable: false,
		frame: false,
		webPreferences: {
			session: _session
		}
	});

	authWindow.setMenu(null);

	authWindow.loadURL('file://' + __dirname + '/auth.html');

	mainWindow = new BrowserWindow({
		parent: authWindow,
		width: 730,
		height: 500,
		title: 'GiftSeeker',
		icon: __dirname + '/icon.ico',
		show: false,
		center: true,
		resizable: false,
		frame: false,
		webPreferences: {
			session: _session
		}
	});

	mainWindow.setMenu(null);

	//authWindow.webContents.openDevTools();
	mainWindow.webContents.openDevTools();

	//### Browser for websites

	Browser =  new BrowserWindow({
		parent: mainWindow,
		icon: __dirname + '/icon.ico',
		title: 'GS Browser',
		width: 1000,
		height: 600,
		modal: true,
		show: false,
		center: true,
		resizable: false,
		webPreferences: {
			nodeIntegration: false,
			session: _session
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
	global.Browser    = Browser;
	global.execPath   = execPath;
	global.storage    = storage;
	global.Config     = Config;
	global.Lang       = Lang;
});

class LanguageClass {
	constructor(){
		let _this = this;
		this.languages = {};
		let lng_to_load = [];
		let dir = fs.readdirSync(storage.getDataPath());

		for(let x = 0; x < dir.length; x++){
			if( dir[x].indexOf('lang.') >= 0 ){
				lng_to_load.push(dir[x].replace('.json', ''));
			}
		}

		storage.getMany(lng_to_load, function(error, langs){
			if(error) throw error;

			_this.languages = langs.lang;
		});
	}

	get(key){
		let response = this.languages[Config.get('lang', 'ru_RU')];
		let splited  = key.split('.');

		for(let i = 0; i < splited.length; i++){
			if( response[splited[i]] !== undefined ){
				response = response[splited[i]];
			}
			else{
				response = key;
				break;
			}
		}

		return response;
	}

	list(){
		return this.languages;
	}
}

class ConfigClass {
	constructor(){
		let _this = this;
		this.settings = {};

		storage.get("configs", function(error, data){
			if(error) throw error;

			_this.settings = data;
		});
	}

	set(key, value){
		this.settings[key] = value;
		storage.set("configs", this.settings);
	}

	get(key, def_val){
		if( this.settings[key] !== undefined )
			return this.settings[key];

		if( def_val )
			return def_val;

		return false;
	}

}