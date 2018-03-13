'use strict';
const {app, nativeImage, shell, Menu, session, Tray, BrowserWindow, ipcMain, ipcRenderer} = require('electron');
const storage = require('electron-json-storage');
const fs = require('fs');
const Request = require('request-promise');

let authWindow;
let mainWindow;
let Browser;
let _session = null;
let Config   = null;
let Lang     = null;
let execPath = process.execPath.match(/.*\\/i)[0];
let tray     = null;
let user     = null;

// for windows portable
if( process.env.PORTABLE_EXECUTABLE_DIR !== undefined )
	execPath = process.env.PORTABLE_EXECUTABLE_DIR + "\\";

storage.setDataPath(execPath + 'data');

ipcMain.on('save-user', function(event, data) {
    user = data;
	global.user = data;
});
ipcMain.on('change-lang', function(event, data) {
	Lang.change(data);
	event.sender.send('change-lang', data);
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
	_session.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36');

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
			session: _session,
			devTools: false
		}
	});

	authWindow.setMenu(null);

	authWindow.loadURL('file://' + __dirname + '/auth.html');

	mainWindow = new BrowserWindow({
		width: 730,
		height: 500,
		title: 'GiftSeeker',
		icon: __dirname + '/icon.ico',
		show: false,
		center: true,
		resizable: false,
		frame: false,
		webPreferences: {
			session: _session,
			//devTools: false
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
			session: _session,
			devTools: false
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

        if( Config.get('start_minimized') )
            authWindow.hide();
        else
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


    // Работа с треем
    tray = new Tray(nativeImage.createFromPath(__dirname + '/icon.ico'));
    const trayMenu = Menu.buildFromTemplate([
        {
            label: "Open Website", click: () => {
                Browser.loadURL("http://giftseeker.ru/");
                Browser.show();
            }
        },
        { type: "separator" },
        { role: "quit" }
    ]);

    tray.setToolTip("GiftSeeker");
    tray.setContextMenu(trayMenu);
    tray.on('click', () => {
       if( user === null )
           authWindow.isVisible() ? authWindow.hide() : authWindow.show();
       else
           mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

	// Ссылки в глобальное пространство
	global.authWindow = authWindow;
	global.mainWindow = mainWindow;
	global.Browser    = Browser;
	global.storage    = storage;
	global.Config     = Config;
	global.Lang       = Lang;
	global.ipcMain    = ipcMain;
	global.TrayIcon   = tray;
	global.shell      = shell;
	global.Request    = Request;
});

class LanguageClass {
	constructor(){
        this.default    = 'ru_RU';
		this.languages  = {};
        this.langsCount = 0;

		// Проверяем наличие локализаций в директории с данными, если чего-то не хватает то скачиваем
		Request({uri: 'http://giftseeker.ru/api/langs', json: true})
		.then((data) => {
			if(data.response !== false){
				data = JSON.parse(data.response).langs;
				let initStarted = false;

				for(let one in data){
					if( !fs.existsSync(storage.getDataPath() + '/' + data[one]) ){
						Request({uri:'http://giftseeker.ru/trans/' + data[one], json: true})
						.then((lang) => {
							storage.set(data[one].replace('.json', ''), lang, () => {
								if( !initStarted ){
									this.loadLangs();
									initStarted = true;
								}
							});
						});
					}
					else
						this.loadLangs();
				}
			}
		}).catch(() => {
			this.loadLangs();
		});
	}

    loadLangs(){
        let _this = this;

        if( fs.existsSync(storage.getDataPath()) ){
            let lng_to_load = [];
            let dir = fs.readdirSync(storage.getDataPath());

            for(let x = 0; x < dir.length; x++){
                if( dir[x].indexOf('lang.') >= 0 ){
                    lng_to_load.push(dir[x].replace('.json', ''));
                }
            }

            if( !lng_to_load.length )
                return;

            storage.getMany(lng_to_load, function(error, langs){
                if(error) throw new Error(`Can't load selected translation`);

                let lng;

                for(lng in langs.lang ){
                    _this.langsCount++;
                }

                if( langs.lang[Config.get('lang', _this.default)] === undefined ){
                    _this.default = lng;
                    Config.set('lang', _this.default);
                }

                _this.languages = langs.lang;
            });
        }
    }

	get(key){
		let response = this.languages;
		let splited  = (Config.get('lang', this.default) + '.' + key).split('.');

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

    change(setLang){
        Config.set('lang', setLang);

    }

    count(){
        return this.langsCount;
    }

    current(){
        return Config.get('lang', this.default);
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

		if( def_val !== undefined )
			return def_val;

		return false;
	}

}