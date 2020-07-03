"use strict";
const {
  app,
  nativeImage,
  shell,
  Menu,
  Tray,
  BrowserWindow,
  ipcMain,
  dialog
} = require("electron");
const { autoUpdater } = require("electron-updater");
const autoLaunch = require("auto-launch");

const ENV = require("./environment");
const config = require("./config");
const settings = require("../app/settings");

const language = require("../app/language");

const gotTheLock = app.requestSingleInstanceLock();

let appLoaded = false;

let authWindow = null;
let mainWindow = null;
let browserWindow = null;
let user = null;

app.disableHardwareAcceleration();

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

app.on("ready", async () => {
  await settings.init();
  const services = require("../app/seeker/bundle");
  const programSession = require("./session");

  settings.on("change", "start_with_os", startWithOs => {
    autoStartControl(startWithOs);
  });

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
      session: programSession,
      enableRemoteModule: true,
      devTools: ENV.devMode,
      nodeIntegration: true
    }
  });

  authWindow.setMenu(null);

  const { minWidth, maxWidth, minHeight, maxHeight } = config.window;

  const windowWidth = (() => {
    const defaultWidth = config.window.defaultWidth;
    const width = settings.get("window_width", defaultWidth);

    if (width < minWidth || width > maxWidth) return defaultWidth;

    return width;
  })();

  const windowHeight = (() => {
    const defaultHeight = config.window.defaultHeight;
    const height = settings.get("window_height", defaultHeight);

    if (height < minHeight || height > maxHeight) return defaultHeight;

    return height;
  })();

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: minWidth,
    maxWidth: maxWidth,
    minHeight: minHeight,
    maxHeight: maxHeight,
    backgroundColor: "#111b29",
    title: config.appName,
    icon: config.appIcon,
    show: false,
    center: true,
    resizable: true,
    fullscreenable: false,
    maximizable: false,
    frame: false,
    webPreferences: {
      session: programSession,
      enableRemoteModule: true,
      devTools: ENV.devMode,
      nodeIntegration: true,
      backgroundThrottling: false,
      webSecurity: false
    }
  });

  mainWindow.setMenu(null);

  if (ENV.devMode) {
    //authWindow.webContents.openDevTools({ mode: "detach" });
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
    webPreferences: {
      session: programSession,
      nodeIntegration: false,
      devTools: false,
      webSecurity: false,
      webviewTag: true
    }
  });

  browserWindow.loadFile("./src/electron/web/blank.html");

  browserWindow.setMenu(null);

  browserWindow.on("close", e => {
    e.preventDefault();
    browserWindow.loadFile("./src/electron/web/blank.html");
    browserWindow.hide();

    if (mainWindow.hidden) authWindow.focus();
    else mainWindow.focus();
  });

  //### end browser for websites
  mainWindow.on("resize", () => {
    const [newWidth, newHeight] = mainWindow.getContentSize();

    settings.set("window_width", newWidth);
    settings.set("window_height", newHeight);
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

  tray.setToolTip(`${config.appName} ${ENV.currentBuild}`);
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
    currentBuild: ENV.currentBuild,
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
    services
  };

  startApp();
});

function startApp() {
  if (appLoaded) return;

  language
    .init()
    .then(() => {
      authWindow.loadFile("./src/electron/web/auth.html");

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
