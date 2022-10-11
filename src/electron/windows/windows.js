const { BrowserWindow } = require("electron");
const ENV = require("../../environment");
const { appName, appIcon, window: windowConfig } = require("../config");

const windows = {};

const init = settings => {
  const authWindow = new BrowserWindow({
    width: 280,
    height: 340,
    title: appName,
    icon: appIcon,
    show: false,
    center: true,
    resizable: false,
    frame: false,
    webPreferences: {
      webSecurity: false,
      devTools: ENV.devMode,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  authWindow.setMenu(null);

  const { width, height } = windowConfig;

  const windowWidth = (() => {
    const currentWidth = settings.get("window_width", width.default);

    if (currentWidth < width.min || currentWidth > width.max) {
      return width.default;
    }

    return currentWidth;
  })();

  const windowHeight = (() => {
    const currentHeight = settings.get("window_height", height.default);

    if (currentHeight < height.min || currentHeight > height.max) {
      return height.default;
    }

    return currentHeight;
  })();

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: width.min,
    maxWidth: width.max,
    minHeight: height.min,
    maxHeight: height.max,
    backgroundColor: "#111b29",
    title: appName,
    icon: appIcon,
    show: false,
    center: true,
    resizable: true,
    fullscreenable: false,
    maximizable: false,
    frame: false,
    webPreferences: {
      contextIsolation: false,
      devTools: ENV.devMode,
      nodeIntegration: true,
      backgroundThrottling: false,
      webSecurity: false,
    },
  });

  mainWindow.setMenu(null);

  if (ENV.devMode) {
    // authWindow.webContents.openDevTools({ mode: "detach" });
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

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

  authWindow.on("closed", () => (windows.auth = null));
  mainWindow.on("closed", () => (windows.main = null));

  windows.auth = authWindow;
  windows.main = mainWindow;

  return windows;
};

/**
 * Returns an active window
 * Active window depends of user auth state
 * @param {boolean} userIsAuthorized
 */
const active = userIsAuthorized => {
  return userIsAuthorized ? windows.main : windows.auth;
};

module.exports = {
  init,
  active,
  auth: () => windows.auth,
  main: () => windows.main,
};
