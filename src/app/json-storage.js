const path = require("path");
const os = require("os");
const fs = require("fs");

let currentDataPath = os.tmpdir();

const setDataPath = directory => {
  if (!path.isAbsolute(directory)) {
    throw new Error("The user data path should be an absolute directory");
  }

  currentDataPath = path.normalize(directory);
};

const getDataPath = () => {
  return currentDataPath;
};

const resolveFilePath = filename => {
  return path.resolve(currentDataPath, filename + ".json");
};

/**
 *
 * @param filename
 * @param data
 * @returns {Promise<boolean>}
 */
const saveFile = (filename, data) => {
  return new Promise(resolve => {
    fs.mkdir(currentDataPath, { recursive: true }, error => {
      if (error) {
        resolve(false);
        return;
      }

      const jsonData = JSON.stringify(data, null, 2);

      fs.writeFile(resolveFilePath(filename), jsonData, "utf8", error => {
        resolve(!error);
      });
    });
  });
};

const loadMany = filenames => {
  return Promise.all(filenames.map(filename => loadFile(filename)));
};

/**
 * Load json data from stored file
 * @param filename
 * @returns {Promise<Record<any, any>>}
 */
const loadFile = filename => {
  return new Promise((resolve, reject) => {
    fs.readFile(resolveFilePath(filename), "utf8", (error, data) => {
      if (error) {
        reject(`File loading error: ${error}`);
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(`File parsing error: ${e}`);
      }
    });
  });
};

/**
 * Returns all files list from current storage path
 * @returns {Promise<string[]>}
 */
const filesList = () => {
  return new Promise(resolve => {
    fs.readdir(currentDataPath, (err, data) => {
      resolve(data);
    });
  });
};

module.exports = {
  setDataPath,
  getDataPath,
  loadFile,
  loadMany,
  saveFile,
  filesList,
};
