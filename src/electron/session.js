const { session } = require("electron");
const axios = require("axios");
const { steamUrl } = require("../config");

const create = (settings, sessionName) => {
  let accountInfo = { loggedIn: false };
  const _session = session.fromPartition(`persist:${sessionName}`);
  _session.setUserAgent(settings.get("user_agent"));

  settings.on("change", "user_agent", newUserAgent => {
    _session.setUserAgent(newUserAgent);
  });

  const extractCookiesByUrl = async url => {
    const domain = new URL(url).hostname.replace("www.", "");

    return _session.cookies.get({ domain });
  };

  const extractCookiesStringByUrl = url => {
    return extractCookiesByUrl(url)
      .then(cookies =>
        cookies.map(cookie => cookie.name + "=" + cookie.value).join("; "),
      )
      .catch(() => "");
  };

  const checkUserIsLoggedIn = async () => {
    const cookieString = await extractCookiesStringByUrl(steamUrl);

    accountInfo = await axios
      .get(steamUrl, {
        headers: { Cookie: cookieString },
      })
      .then(({ data }) => {
        if (!checkSteamLoggedIn(data)) {
          return {
            loggedIn: false,
          };
        }

        return {
          loggedIn: true,
          userData: extractSteamData(data),
        };
      })
      .catch(() => ({
        loggedIn: false,
        error: true,
      }));

    return accountInfo;
  };

  const checkSteamLoggedIn = html => html.indexOf("login/home/?goto=") === -1;

  const extractSteamData = html => {
    const [, avatar, username] = html.match(
      /(https:\/\/avatars.*jpg).*alt=.(.*)"/,
    );

    return {
      avatar,
      username,
    };
  };

  const flush = async () => {
    await _session.clearStorageData();
  };

  return {
    flush,
    getSessionInstance: () => _session,
    checkUserIsLoggedIn,
    extractCookiesByUrl,
    extractCookiesStringByUrl,
    getAccountInfo: () => accountInfo,
  };
};

module.exports = { create };
