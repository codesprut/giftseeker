const { remote, shell } = require("electron");
const { Browser, settings } = remote.getGlobal("sharedData");

import language from "./language.js";

const openUrl = (url, useProgramBrowser) => {
  if (settings.get("use_system_browser") && !useProgramBrowser)
    return shell.openExternal(url);

  Browser.loadURL(url);
  Browser.setTitle("GS Browser - " + language.get("auth.browser_loading"));

  Browser.show();
};

const runForAuth = async (websiteUrl, authPageUrl, authContent) => {
  Browser.webContents.on("did-finish-load", () => {
    if (Browser.getURL().indexOf(websiteUrl) >= 0) {
      Browser.webContents
        .executeJavaScript('document.querySelector("body").innerHTML')
        .then(body => {
          if (body.indexOf(authContent) >= 0) Browser.close();
        });
    }
  });

  openUrl(authPageUrl, true);

  return new Promise(resolve => {
    Browser.once("close", () => {
      Browser.webContents.removeAllListeners("did-finish-load");

      resolve(
        Browser.webContents.session.cookies
          .get({ domain: websiteUrl.split("/")[2].replace("www.", "") })
          .then(cookies =>
            cookies.map(cookie => cookie.name + "=" + cookie.value).join("; "),
          )
          .catch(() => ""),
      );
    });
  });
};

export default {
  openUrl,
  runForAuth,
};
