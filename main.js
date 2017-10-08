var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;

var version = '4.0.0.0';

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});


app.on('ready', function() {

	mainWindow = new BrowserWindow({
		width: 700,
		height: 625,
		title: 'GiftSeeker ' + version,
		//icon: '',
		center: true,
		resizable: false,
		frame: false
	});

	mainWindow.setMenu(null);

	mainWindow.loadURL('file://' + __dirname + '/index.html');

	mainWindow.webContents.openDevTools();

	mainWindow.on('closed', function() {
		mainWindow = null;
	});


});
