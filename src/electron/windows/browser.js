const { BrowserWindow, shell } = require("electron");
const { appIcon } = require("../config");

const create = (session, parentWindow, onClose) => {
  const window = new BrowserWindow({
    parent: parentWindow,
    icon: appIcon,
    title: "GS Browser",
    width: 1024,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    modal: true,
    show: false,
    center: true,
    webPreferences: {
      session: session.getSessionInstance(),
      nodeIntegration: false,
      contextIsolation: false,
      devTools: false,
      webviewTag: true,
    },
  });

  window.loadFile("./src/electron/web/blank.html");

  window.setMenu(null);

  window.on("close", e => {
    e.preventDefault();
    window.loadFile("./src/electron/web/blank.html");
    window.hide();

    onClose();
  });

  const openUrl = (url, useExternalBrowser) => {
    if (useExternalBrowser) {
      shell.openExternal(url);
      return;
    }

    window.loadURL(url);
    window.setTitle("GS Browser");

    window.show();
  };

  const authorizationWindow = async (websiteUrl, authPageUrl, authContent) => {
    window.webContents.on("did-finish-load", () => {
      if (window.getURL().indexOf(websiteUrl) >= 0) {
        window.webContents
          .executeJavaScript('document.querySelector("body").innerHTML')
          .then(body => {
            if (body.indexOf(authContent) >= 0) {
              window.close();
            }
          });
      }
    });

    openUrl(authPageUrl);

    return new Promise(resolve => {
      window.once("close", () => {
        window.webContents.removeAllListeners("did-finish-load");

        const cookies = session.extractCookiesByDomain(websiteUrl);

        resolve(cookies);
      });
    });
  };

  return {
    openUrl,
    authorizationWindow,
  };
};

module.exports = {
  create,
};
