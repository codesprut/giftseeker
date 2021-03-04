"use strict";
const {
  app,
  nativeImage,
  shell,
  Menu,
  Tray,
  ipcMain,
  dialog,
} = require("electron");
const { autoUpdater } = require("electron-updater");

const ENV = require("../environment");
const config = require("./config");
const settings = require("../app/settings");
const autoStart = require("./auto-start");

const language = require("../app/language");
const windows = require("./windows");

const isSecondAppInstance = app.requestSingleInstanceLock();

const currentBuild = app.getVersion();

let windowIsReady = false;
let authorizedUser = null;
let preventReadyWindowHiding = false;

app.disableHardwareAcceleration();

(() => {
  if (!isSecondAppInstance) return app.quit();

  app.on("second-instance", () => {
    const activeWindow = windows.active(!!authorizedUser);

    if (activeWindow.isMinimized()) activeWindow.restore();
    if (!activeWindow.isVisible()) activeWindow.show();

    activeWindow.focus();
  });

  ipcMain.on("save-user", (event, data) => {
    authorizedUser = data;
    global.user = data;
  });

  ipcMain.on("change-lang", (event, data) => {
    language.change(data);
    event.sender.send("change-lang", data);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("ready", async () => {
    await settings.init();

    settings.set("start_with_os", autoStart.isEnabled());
    settings.on("change", "start_with_os", autoStart.set);

    const services = require("../app/seeker/services");

    const {
      auth: authWindow,
      main: mainWindow,
      browser: browserWindow,
    } = windows.init();

    const trayIcon = createTrayIcon(browserWindow);

    // Variables shared with browser windows
    global.sharedData = {
      isPortable: ENV.isPortable,
      autoUpdater,
      currentBuild,
      devMode: ENV.devMode,
      shell,
      trayIcon,
      ipcMain,
      language,
      config,
      settings,
      Browser: browserWindow,
      authWindow: authWindow,
      mainWindow: mainWindow,
      services,
    };

    startApp(authWindow);
  });
})();

const startApp = authWindow => {
  language
    .init()
    .then(() => {
      authWindow.loadFile("./src/electron/web/auth.html");

      authWindow.on("ready-to-show", () => {
        windowIsReady = true;
        authWindow.show();

        if (settings.get("start_minimized") && !preventReadyWindowHiding) {
          authWindow.hide();
        } else authWindow.focus();
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
            "Try restart the app or contact with developer",
        })
        .finally(() => {
          app.quit();
        });
    });
};

const createTrayIcon = browserWindow => {
  const trayIcon = new Tray(nativeImage.createFromPath(config.appIcon));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open Website",
      click: () => {
        browserWindow.loadURL(config.websiteUrl);
        browserWindow.show();
      },
    },
    { type: "separator" },
    { role: "quit" },
  ]);

  trayIcon.setToolTip(`${config.appName} ${currentBuild}`);
  trayIcon.setContextMenu(trayMenu);
  trayIcon.on("click", () => {
    const activeWindow = windows.active(!!authorizedUser);
    preventReadyWindowHiding = true;

    if (windowIsReady) {
      activeWindow.isVisible() ? activeWindow.hide() : activeWindow.show();
    }
  });

  return trayIcon;
};
