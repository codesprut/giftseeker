const events = require("events");
const path = require("path");

const Settings = require("../modules/settings");
const Services = require("../core/services");
const config = require("../config");
const logger = require("./service-logger");

let currentSession = null;
let sessions = [];

const eventEmitter = new events.EventEmitter();

const current = () => {
  return currentSession;
};

const select = name => {
  const session = sessions.find(it => it.name === name);

  if (!session) {
    throw new Error("session doesn't exists");
  }

  const { name: currentName } = current() ?? {};

  if (currentName !== name) {
    currentSession = session;
    eventEmitter.emit("session:changed");
  }
};

const init = async settings => {
  const storedSessions = settings.get("sessions", []);
  const lastSession = settings.get("last-session");

  const promises = storedSessions.map(name => initSession(name));

  await Promise.all(promises);

  try {
    select(lastSession);
  } catch (ex) {
    if (sessions.length) {
      select(sessions[0].name);
    }
  }

  eventEmitter.on("session:changed", () => {
    settings.set("last-session", current().name);
  });

  eventEmitter.on("sessions.list:changed", () => {
    if (sessions.length) {
      select(sessions[0].name);
    } else {
      currentSession = null;
    }

    const sessionNames = sessions.map(it => it.name);

    settings.set("sessions", sessionNames);
  });
};

const initSession = async sessionName => {
  const sessionStoragePath = path.resolve(config.storageDataPath, sessionName);

  const settings = await Settings.build(`${sessionName}/session`, {
    user_agent: config.defaultSettings.user_agent,
  });

  const services = Services.map(service => new service(settings));

  for (const service of services) {
    logger.attach(sessionStoragePath, service);
    service.runWorker();
  }

  sessions.push({
    name: sessionName,
    settings,
    services,
  });
};

const destroy = name => {
  sessions = sessions.filter(it => it.name !== name);

  eventEmitter.emit("sessions.list:changed");
};

const create = name => {
  return initSession(name).then(() => {
    eventEmitter.emit("sessions.list:changed");
  });
};

const list = () => {
  return sessions;
};

module.exports = {
  current,
  init,
  select,
  list,
  create,
  destroy,
};
