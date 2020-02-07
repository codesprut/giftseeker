const req = require("request");

const request = options => {
  return new Promise((resolve, reject) => {
    req(options, (error, response, body) => {
      if (error) reject(error);

      resolve(response);
    });
  });
};

module.exports = request;
