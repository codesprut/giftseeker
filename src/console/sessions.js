const events = require("events");
const Settings = require("../modules/settings");
const Services = require("../core/services");

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

  currentSession = session;

  if (current().name !== name) {
    eventEmitter.emit("session:changed");
  }
};

const init = async settings => {
  const storedSessions = settings.get("sessions", []);

  const promises = storedSessions.map(name => initSession(name));

  await Promise.all(promises);

  if (sessions.length) {
    select(sessions[0].name);
  }

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

const initSession = async name => {
  const settings = await Settings.build(`session-${name}`);
  const services = Services.map(service => new service(settings));

  sessions.push({
    name,
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
