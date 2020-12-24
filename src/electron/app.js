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

let authorizedUser = null;

app.disableHardwareAcceleration();

(() => {
  if (!isSecondAppInstance) return app.quit();

  app.on("second-instance", () => {
    const activeWindow = windows.active();

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
    const services = require("../app/seeker/bundle");

    settings.on("change", "start_with_os", autoStart.set);

    windows.init();

    const trayIcon = createTrayIcon();

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
      Browser: windows.browser(),
      authWindow: windows.auth(),
      mainWindow: windows.main(),
      services,
    };

    startApp();
  });
})();

const startApp = () => {
  language
    .init()
    .then(() => {
      windows.auth().loadFile("./src/electron/web/auth.html");

      windows.auth().on("ready-to-show", () => {
        windows.auth().show();

        if (settings.get("start_minimized")) windows.auth().hide();
        else windows.auth().focus();
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

const createTrayIcon = () => {
  const tray = new Tray(nativeImage.createFromPath(config.appIcon));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open Website",
      click: () => {
        windows.browser().loadURL(config.websiteUrl);
        windows.browser().show();
      },
    },
    { type: "separator" },
    { role: "quit" },
  ]);

  tray.setToolTip(`${config.appName} ${currentBuild}`);
  tray.setContextMenu(trayMenu);
  tray.on("click", () => {
    const currentWindow = activeWindow();

    currentWindow.isVisible() ? currentWindow.hide() : currentWindow.show();
  });

  return tray;
};

const activeWindow = () => {
  return authorizedUser === null ? windows.auth() : windows.main();
};
