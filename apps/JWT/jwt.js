const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();

class Jwt {
  createToken(payload, options) {
    return jsonwebtoken.sign({ ...payload }, process.env.JWT_SECRET_KEY, {
      ...options,
    });
  }

  async verifyToken(token) {
    return new Promise(async (resolve, reject) => {
      await jsonwebtoken.verify(
        token,
        process.env.JWT_SECRET_KEY,
        (err, decoded) => {
          if (decoded) {
            return resolve(decoded);
          } else {
            return resolve("expired");
          }
        }
      );
    });
  }
}

module.exports = { Jwt };
