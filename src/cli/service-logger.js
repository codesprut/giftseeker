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
    fileSuffix: `${day}-${month}-${year}`,
    rowTime: `${hours}:${minutes}`,
  };
};

const attach = (storagePath, service) => {
  const serviceName = service.name.toLowerCase();

  service.on("log", (message, severity) => {
    const { fileSuffix, rowTime } = currentDate();

    const filename = `${serviceName}-${fileSuffix}.log`;
    const filepath = path.resolve(storagePath, filename);

    fs.appendFileSync(filepath, `[${severity}]${rowTime} ${message}` + os.EOL);
  });
};

module.exports = { attach };
