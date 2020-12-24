const { BrowserWindow } = require("electron");
const { create: createSession } = require("./session");
const ENV = require("../environment");
const config = require("./config");
const settings = require("../app/settings");

let authWindow = null;
let mainWindow = null;
let browserWindow = null;

const init = () => {
  const session = createSession();

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
      session: session,
      enableRemoteModule: true,
      devTools: ENV.devMode,
      contextIsolation: false,
      nodeIntegration: true,
    },
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
      session: session,
      contextIsolation: false,
      enableRemoteModule: true,
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

  // ### Browser for websites

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
      session: session,
      nodeIntegration: false,
      contextIsolation: false,
      devTools: false,
      webSecurity: false,
      webviewTag: true,
    },
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

  // ### end browser for websites
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
};

const active = () => {
  return mainWindow;
};

module.exports = {
  init,
  active,
  auth: () => authWindow,
  main: () => mainWindow,
  browser: () => browserWindow,
};
