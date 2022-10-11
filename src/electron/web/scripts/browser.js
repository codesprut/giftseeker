const { ipcRenderer } = require("electron");

const openUrl = (url, forceInternalBrowser) => {
  ipcRenderer.send("browser-open-url", {
    url,
    forceInternalBrowser,
  });
};

const authorizationWindow = async (websiteUrl, authPageUrl, authContent) => {
  return new Promise(resolve => {
    ipcRenderer.send("browser-authorization-window", {
      websiteUrl,
      authPageUrl,
      authContent,
    });

    ipcRenderer.once(
      "browser-authorization-window-closed",
      (event, cookies) => {
        resolve(cookies);
      },
    );
  });
};

export default {
  openUrl,
  authorizationWindow,
};
