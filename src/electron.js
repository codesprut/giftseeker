"use strict";
const {
  app,
  nativeImage,
  shell,
  Menu,
  session,
  Tray,
  BrowserWindow,
  ipcMain,
  dialog
} = require("electron");
const { autoUpdater } = require("electron-updater");
const autoLaunch = require("auto-launch");
const request = require("request-promise-native");

const config = require("./app/config");
const ENV = require("./app/environment");
const storage = require("electron-json-storage");
const settings = require("./app/settings");

const language = require("./app/language");

const gotTheLock = app.requestSingleInstanceLock();

let appLoaded = false;

let authWindow = null;
let mainWindow = null;
let browserWindow = null;
let _session = null;
let user = null;

app.disableHardwareAcceleration();

storage.setDataPath(config.storagePath);

const autostart = new autoLaunch({ name: config.appName });

if (!gotTheLock) return app.quit();

// Go focus into window if second instance started
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();

    if (!mainWindow.isVisible()) mainWindow.show();

    mainWindow.focus();
  }
});

ipcMain.on("save-user", function(event, data) {
  user = data;
  global.user = data;
});

// TODO: language event emitter
ipcMain.on("change-lang", function(event, data) {
  language.change(data);
  event.sender.send("change-lang", data);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("ready", () => {
  settings.on("change", (configKey, newValue) => {
    if (configKey === "start_with_os") autoStartControl(newValue);
  });
  settings.init();

  _session = session.fromPartition(`persist:${config.appName}`);
  _session.setUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.88 Mobile/15E148 Safari/605.1"
  );

  authWindow = new BrowserWindow({
    width: 280,
    height: 340,
    title: config.appName,
    icon: config.appIcon,
    show: false,
    center: true,
    resizable: false,
    frame: false,
    webPreferences: {
      session: _session,
      devTools: ENV.devMode,
      nodeIntegration: true
    }
  });

  authWindow.setMenu(null);

  mainWindow = new BrowserWindow({
    width: 730,
    height: 500,
    title: config.appName,
    icon: config.appIcon,
    show: false,
    center: true,
    resizable: false,
    frame: false,
    webPreferences: {
      session: _session,
      devTools: ENV.devMode,
      nodeIntegration: true,
      backgroundThrottling: false,
      webSecurity: false
    }
  });

  mainWindow.setMenu(null);

  if (ENV.devMode) {
    authWindow.webContents.openDevTools({ mode: "detach" });
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  //### Browser for websites

  browserWindow = new BrowserWindow({
    parent: mainWindow,
    icon: config.appIcon,
    title: "GS Browser",
    width: 1024,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    modal: true,
    show: false,
    center: true,
    alwaysOnTop: true,
    webPreferences: {
      session: _session,
      nodeIntegration: false,
      devTools: false,
      webSecurity: false,
      webviewTag: true
    }
  });

  browserWindow.loadFile("./src/web/blank.html");

  browserWindow.setMenu(null);

  browserWindow.on("close", e => {
    e.preventDefault();
    browserWindow.loadFile("./src/web/blank.html");
    browserWindow.hide();

    if (mainWindow.hidden) authWindow.focus();
    else mainWindow.focus();
  });

  //### end browser for websites

  authWindow.on("show", () => {
    authWindow.webContents.executeJavaScript("onShow()");
  });

  authWindow.on("close", () => {
    authWindow.removeAllListeners("close");
    mainWindow.close();
  });

  mainWindow.on("close", () => {
    mainWindow.removeAllListeners("close");
    authWindow.close();
  });

  authWindow.on("closed", () => {
    authWindow = null;
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const tray = new Tray(nativeImage.createFromPath(config.appIcon));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open Website",
      click: () => {
        browserWindow.loadURL(config.websiteUrl);
        browserWindow.show();
      }
    },
    { type: "separator" },
    { role: "quit" }
  ]);

  tray.setToolTip(`${config.appName} ${app.getVersion()}`);
  tray.setContextMenu(trayMenu);
  tray.on("click", () => {
    if (user === null)
      authWindow.isVisible() ? authWindow.hide() : authWindow.show();
    else mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  // Variables shared with browser windows
  global.sharedData = {
    isPortable: ENV.isPortable,
    autoUpdater,
    devMode: ENV.devMode,
    shell,
    TrayIcon: tray,
    ipcMain,
    language,
    config,
    settings,
    Browser: browserWindow,
    authWindow,
    mainWindow,
    Request: request
  };

  startApp();
});

function startApp() {
  if (appLoaded) return;

  language
    .init()
    .then(() => {
      authWindow.loadFile("./src/web/auth.html");

      authWindow.on("ready-to-show", function() {
        authWindow.show();

        if (settings.get("start_minimized")) authWindow.hide();
        else authWindow.focus();

        appLoaded = true;
      });
    })
    .catch(ex => {
      dialog
        .showMessageBox({
          type: "error",
          title: "Error loading translations",
          message:
            ex.message +
            ENV.EOL +
            "Try restart the app or contact with developer"
        })
        .finally(() => {
          app.quit();
        });
    });
}

function autoStartControl(startWithOs) {
  if (startWithOs === true && !ENV.devMode) {
    autostart.enable().catch(() => {});
    return;
  }

  autostart.disable().catch(() => {});
}
