"use strict";
const { Jwt } = require("./jwt");

const { unauthorizedResponse } = require("../helpers/customResponseTemplate");
const postgreConnection = require("../helpers/sequelizeHelper");

class Token {
  static async authenticate(req, res, next) {
    const bearerHeader = req.headers["token"];

    if (typeof bearerHeader != "undefined") {
      try {
        const decode = await new Jwt().verifyToken(bearerHeader);

        if (decode == "expired") {
          return unauthorizedResponse(req, res, "Token is expired / Invalid");
        } else {
          req.user = decode;

          let user_id = req.user.user_id;

          const query = `SELECT * from tbl_mobilesessiondetail where userid = ${user_id} AND token = '${bearerHeader}'`;

          let data = await postgreConnection.query(query);

          if (data.length > 0) {
            next();
          } else {
            return unauthorizedResponse(req, res, `Not Authenticated`);
          }
        }
      } catch (e) {
        console.log(e);
        return unauthorizedResponse(req, res, `Please Provide a valid token `);
      }
    } else {
      return unauthorizedResponse(
        req,
        res,
        `A token is required for authentication.`
      );
    }
  }
  static async checkDmsToken(req, res, next) {
    const bearerHeader = req.headers["token"];

    if (typeof bearerHeader != "undefined") {
      try {
        const decode = await new Jwt().verifyToken(bearerHeader);

        if (decode == "expired") {
          return unauthorizedResponse(
            req,
            res,
            "DMS Token is expired / Invalid"
          );
        } else {
          req.user = decode;

          const { username } = req.user;
          const { password } = req.user;

          const query = `select  dmsusername,dmsuserpassword from tbl_eazyorderapiconfiguration where dmsusername= ${username} and dmsuserpassword= ${password} `;

          let data = await postgreConnection.query(query);

          if (data.length > 0) {
            next();
          } else {
            return unauthorizedResponse(
              req,
              res,
              `DMS Token Not Authenticated`
            );
          }
        }
      } catch (e) {
        console.log(e);
        return unauthorizedResponse(
          req,
          res,
          `Please Provide a valid DMS token `
        );
      }
    } else {
      return unauthorizedResponse(
        req,
        res,
        `A DMS token is required for authentication.`
      );
    }
  }
}

module.exports = Token;
