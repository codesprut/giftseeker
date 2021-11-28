const fs = require("fs");
const os = require("os");
const path = require("path");

const currentDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = ("0" + date.getHours()).slice(-2);
  const minutes = ("0" + date.getMinutes()).slice(-2);

  return {
    date: `${day}-${month}-${year}`,
    time: `${hours}:${minutes}`,
  };
};

const prepareMessage = message => {
  if (typeof message === "object") {
    return message.text.replace("#link#", message.anchor);
  }

  return message;
};

const attach = (storagePath, service) => {
  const serviceName = service.name.toLowerCase();

  service.on("log", (message, severity) => {
    const { date, time } = currentDate();

    const filename = `${serviceName}-${date}.log`;
    const filepath = path.resolve(storagePath, filename);

    const appendText = `[${severity}]${time} ${prepareMessage(message)}`;

    fs.appendFileSync(filepath, appendText + os.EOL);
  });
};

module.exports = { attach };
