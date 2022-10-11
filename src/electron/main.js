"use strict";
const { app, nativeImage, Menu, Tray, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

const ENV = require("../environment");
const config = require("./config");
const storage = require("../modules/json-storage");
const autoStart = require("./auto-start");
const Settings = require("../modules/settings");

const Services = require("../core/services");

const translation = require("../modules/translation");
const sessionConstructor = require("./session");
const browserConstructor = require("./windows/browser");
const windows = require("./windows/windows");

const isPrimaryAppInstance = app.requestSingleInstanceLock();

const currentBuild = app.getVersion();

let windowIsReady = false;
let userIsLoggedIn = false;
let preventReadyWindowHiding = false;

app.disableHardwareAcceleration();

(() => {
  if (!isPrimaryAppInstance) {
    return app.quit();
  }

  storage.setDataPath(config.storageDataPath);

  app.on("second-instance", () => {
    const activeWindow = windows.active(userIsLoggedIn);

    if (activeWindow.isMinimized()) {
      activeWindow.restore();
    }
    if (!activeWindow.isVisible()) {
      activeWindow.show();
    }

    activeWindow.focus();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("ready", async () => {
    const settings = await Settings.build("electron", config.defaultSettings);
    const services = Services.map(service => new service(settings));

    settings.set("start_with_os", await autoStart.isEnabled());
    settings.on("change", "start_with_os", autoStart.set);

    const session = sessionConstructor.create(settings, config.appName);
    const { auth: authWindow, main: mainWindow } = windows.init(settings);
    const browser = browserConstructor.create(session, mainWindow, () => {
      if (mainWindow.hidden) {
        authWindow.focus();
      } else {
        mainWindow.focus();
      }
    });

    const logout = () => {
      session.flush();
      windows.main().hide();
      windows.auth().show();

      windows.auth().webContents.executeJavaScript("setLogoutState()");
    };

    // prevent the tray icon from being destroyed by the GC
    // eslint-disable-next-line no-unused-vars
    const trayIcon = createTrayIcon(browser);

    startApp(authWindow, settings);

    ipcMain.on("services-new-session", (event, { serviceName, cookies }) => {
      const service = services.find(service => service.name === serviceName);

      service.setCookie(cookies);
      service.start();
    });

    ipcMain.on("service-button-pressed", async ({ sender }, serviceName) => {
      const service = services.find(service => service.name === serviceName);

      if (service.isStarted()) {
        await service.stop();
      } else {
        const authState = await service.start();

        if (authState === 0) {
          sender.send("service-authorization-required", {
            serviceName,
            websiteUrl: service.websiteUrl,
            authPageUrl: service.authPageUrl,
            authContent: service.authContent,
          });
        }
      }
    });

    ipcMain.on(
      "service-setting-changed",
      (event, { serviceName, settingName, settingValue }) => {
        const service = services.find(service => service.name === serviceName);

        service.setConfig(settingName, settingValue);
      },
    );

    ipcMain.on("services-loaded", ({ sender }) => {
      loadServicesHandlers(sender, services, settings.get("autostart"));
    });

    ipcMain.on("services-unloaded", () => {
      unloadServicesHandlers(services);
    });

    ipcMain.on("window-loaded", ({ sender }, windowName) => {
      sender.send("window-initial-data", {
        websiteUrl: config.websiteUrl,
        userAgent: {
          default: config.defaultSettings.user_agent,
          initial: session.getSessionInstance().getUserAgent(),
        },
        currentBuild,
        accountInfo: session.getAccountInfo(),
        settings: settings.getAll(),
        translations: {
          current: translation.current(),
          phrases: translation.currentPhrases(),
          list: translation.listAvailable(),
        },
        servicesInfo: services.map(service => ({
          name: service.name,
          settings: service.settings,
          state: service.state,
          websiteUrl: service.websiteUrl,
          currency: {
            enabled: service.withValue,
            current: service.currentValue,
            translationKey: service.translationKey("value_label"),
          },
        })),
      });

      if (windowName === "auth-window") {
        checkSessionIsAlive(session, sender);
      } else {
        if (settings.get("start_minimized")) {
          mainWindow.hide();
        } else {
          mainWindow.focus();
        }
      }
    });

    ipcMain.on("check-session-is-alive", async ({ sender }) => {
      const authCheckResult = await session.checkUserIsLoggedIn(currentBuild);

      if (authCheckResult.loggedIn) {
        sender.send("userinfo-updated", authCheckResult.userData);
      } else {
        logout();
      }
    });

    ipcMain.on("translation-changed", ({ sender }, data) => {
      translation.change(data);

      sender.send("translation-changed", {
        current: translation.current(),
        phrases: translation.currentPhrases(),
      });
    });

    ipcMain.on("setting-changed", (event, { key, value }) => {
      settings.set(key, value);
    });

    ipcMain.on("browser-open-url", (event, { url, forceInternalBrowser }) => {
      const useExternalBrowser =
        settings.get("use_system_browser") && !forceInternalBrowser;

      browser.openUrl(url, useExternalBrowser);
    });

    ipcMain.on(
      "browser-authorization-window",
      async ({ sender }, { websiteUrl, authPageUrl, authContent }) => {
        const cookies = await browser.authorizationWindow(
          websiteUrl,
          authPageUrl,
          authContent,
        );

        sender.send("browser-authorization-window-closed", cookies);
      },
    );

    ipcMain.on("authorization-window-closed", ({ sender }) => {
      checkSessionIsAlive(session, sender);
    });

    ipcMain.on("main-window-action", (event, action) => {
      if (action === "close") {
        if (settings.get("minimize_on_close")) {
          mainWindow.hide();
          return;
        }

        mainWindow.close();
      } else if (action === "minimize") {
        mainWindow.hide();
      }
    });

    ipcMain.on("user-logout", logout);

    if (!ENV.isPortable) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
})();

const loadServicesHandlers = (ipc, services, autostart) => {
  for (const service of services) {
    const serviceName = service.name;

    service.on("state.changed", processState => {
      ipc.send("service-state-changed", {
        serviceName,
        processState,
      });
    });

    service.on("currency.changed", currency =>
      ipc.send("service-currency-changed", {
        serviceName,
        currency,
      }),
    );

    service.on("userinfo.updated", userInfo =>
      ipc.send("service-userinfo-updated", {
        serviceName,
        userInfo,
      }),
    );

    service.on("log", (message, severity) => {
      ipc.send("service-new-log", {
        serviceName,
        message,
        severity,
      });
    });

    service.on("tick", totalTicks => {
      ipc.send("service-new-tick", {
        serviceName,
        totalTicks,
        interval: service.workerInterval(),
      });
    });

    if (autostart) {
      service.start(true);
    }

    service.runWorker();
  }
};

const unloadServicesHandlers = services => {
  for (const service of services) {
    service.stopWorker();
    service.clearEvents();
  }
};

const checkSessionIsAlive = async (session, ipcRenderer) => {
  const authCheckResult = await session.checkUserIsLoggedIn(currentBuild);
  userIsLoggedIn = authCheckResult.loggedIn;

  ipcRenderer.send("authorization-check-result", authCheckResult);

  if (authCheckResult.loggedIn) {
    windows.auth().hide();
    windows.main().show();

    windows.main().loadFile("./src/electron/web/main.html");
  }
};

const startApp = (authWindow, settings) => {
  translation
    .init(settings, config.websiteUrl)
    .then(() => {
      authWindow.loadFile("./src/electron/web/auth.html");

      authWindow.on("ready-to-show", () => {
        windowIsReady = true;
        authWindow.show();

        if (settings.get("start_minimized") && !preventReadyWindowHiding) {
          authWindow.hide();
        } else {
          authWindow.focus();
        }
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

const createTrayIcon = browser => {
  const trayIcon = new Tray(nativeImage.createFromPath(config.appIcon));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open Website",
      click: () => {
        browser.openUrl(config.websiteUrl);
      },
    },
    { type: "separator" },
    { role: "quit" },
  ]);

  trayIcon.setToolTip(`${config.appName} ${currentBuild}`);
  trayIcon.setContextMenu(trayMenu);
  trayIcon.on("click", () => {
    const activeWindow = windows.active(userIsLoggedIn);
    preventReadyWindowHiding = true;

    if (windowIsReady) {
      activeWindow.isVisible() ? activeWindow.hide() : activeWindow.show();
    }
  });

  return trayIcon;
};
