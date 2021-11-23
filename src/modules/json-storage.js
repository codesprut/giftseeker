const path = require("path");
const fs = require("fs");

let currentDataPath = undefined;

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
  const dataToSave = isObject(data) ? sortObject(data) : data;

  return new Promise(resolve => {
    fs.mkdir(currentDataPath, { recursive: true }, error => {
      if (error) {
        resolve(false);
        return;
      }

      const jsonData = JSON.stringify(dataToSave, null, 2);

      fs.writeFile(resolveFilePath(filename), jsonData, "utf8", error => {
        resolve(!error);
      });
    });
  });
};

/**
 * Detects var an object
 * @param variable
 * @returns {boolean}
 */
const isObject = variable => {
  return (
    typeof variable === "object" &&
    !Array.isArray(variable) &&
    variable !== null
  );
};

const sortObject = object => {
  return Object.keys(object)
    .sort()
    .reduce((result, key) => {
      result[key] = object[key];
      return result;
    }, {});
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
