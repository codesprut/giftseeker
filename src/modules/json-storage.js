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
  const filenameExtended = filename.endsWith(".json")
    ? filename
    : `${filename}.json`;

  return path.resolve(currentDataPath, filenameExtended);
};

/**
 *
 * @param filename
 * @param data
 * @param sortData
 * @returns {Promise<boolean>}
 */
const saveFile = (filename, data, sortData = false) => {
  const dataToSave = sortData && isObject(data) ? sortObject(data) : data;

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
  const filepath = resolveFilePath(filename);
  const dirpath = path.dirname(filepath);

  return new Promise((resolve, reject) => {
    fs.mkdir(dirpath, { recursive: true }, () => {
      fs.readFile(filepath, "utf8", (error, data) => {
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

/**
 * Check file is exists
 * @param filename
 * @returns {boolean}
 */
const filesExists = filename => {
  return fs.existsSync(resolveFilePath(filename));
};

module.exports = {
  setDataPath,
  getDataPath,
  loadFile,
  loadMany,
  saveFile,
  filesList,
  filesExists,
};
