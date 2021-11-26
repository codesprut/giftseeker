const events = require("events");
const Settings = require("../modules/settings");
const Services = require("../core/services");

let currentSession = null;
let sessionsList = [];

const eventEmitter = new events.EventEmitter();

const current = () => {
  return currentSession;
};

const select = name => {
  const session = sessionsList.find(it => it.name === name);

  if (!session) {
    throw new Error("session doesn't exists");
  }
  currentSession = session;

  eventEmitter.emit("session:changed");
};

const init = async settings => {
  const storedSessions = settings.get("sessions", []);

  const promises = storedSessions.map(name => initSession(name));

  await Promise.all(promises);

  if (sessionsList.length) {
    select(sessionsList[0].name);
  }

  eventEmitter.on("sessions.list:changed", () => {
    if (sessionsList.length) {
      select(sessionsList[0].name);
    } else {
      currentSession = null;
    }

    const sessionNames = sessionsList.map(it => it.name);

    settings.set("sessions", sessionNames);
  });
};

const initSession = async name => {
  const settings = await Settings.build(`session-${name}`);
  const services = Services.map(service => new service(settings));

  sessionsList.push({
    name,
    settings,
    services,
  });
};

const destroy = name => {
  sessionsList = sessionsList.filter(it => it.name !== name);

  eventEmitter.emit("sessions.list:changed");
};

const create = name => {
  return initSession(name).then(() => {
    eventEmitter.emit("sessions.list:changed");
  });
};

const list = () => {
  return sessionsList;
};

module.exports = {
  current,
  init,
  select,
  list,
  create,
  destroy,
};
