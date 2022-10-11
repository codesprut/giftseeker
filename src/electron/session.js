const { session } = require("electron");
const axios = require("axios");
const { websiteUrl } = require("../config");

const create = (settings, sessionName) => {
  let accountInfo = { loggedIn: false };
  const _session = session.fromPartition(`persist:${sessionName}`);
  _session.setUserAgent(settings.get("user_agent"));

  settings.on("change", "user_agent", newUserAgent => {
    _session.setUserAgent(newUserAgent);
  });

  const extractCookiesByDomain = url => {
    const domain = new URL(url).hostname.replace("www.", "");

    return _session.cookies
      .get({ domain })
      .then(cookies =>
        cookies.map(cookie => cookie.name + "=" + cookie.value).join("; "),
      )
      .catch(() => "");
  };

  const checkUserIsLoggedIn = async currentBuild => {
    const cookies = await extractCookiesByDomain(websiteUrl);
    accountInfo = await axios
      .get(`${websiteUrl}api/userData?ver=${currentBuild}`, {
        headers: { Cookie: cookies },
      })
      .then(({ data }) => {
        if (data.response) {
          return {
            loggedIn: true,
            userData: data.response,
          };
        }

        return {
          loggedIn: false,
        };
      })
      .catch(() => ({
        loggedIn: false,
        error: true,
      }));

    return accountInfo;
  };

  const flush = async () => {
    accountInfo = { loggedIn: false };
    const cookies = await extractCookiesByDomain(websiteUrl);

    return axios.get(`${websiteUrl}logout`, {
      headers: { Cookie: cookies },
    });
  };

  return {
    flush,
    getSessionInstance: () => _session,
    checkUserIsLoggedIn,
    extractCookiesByDomain,
    getAccountInfo: () => accountInfo,
  };
};

module.exports = { create };
