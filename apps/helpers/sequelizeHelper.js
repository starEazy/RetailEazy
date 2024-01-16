"use strict";
const { log } = require("winston");
const db = require("../../database/models/index.js");
const sequelize = require("sequelize");
const postgreConnection = {
  query: async (query, types) => {
    if (types) {
      let result;
      switch (types) {
        case "select":
          result = await db.sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT,
          });
          return result;
        case "insert":
          result = await db.sequelize.query(query, {
            type: sequelize.QueryTypes.INSERT,
          });
          return result;
        case "update":
          result = await db.sequelize.query(query, {
            type: sequelize.QueryTypes.UPDATE,
          });
          return result;
      }
    } else {
      let result = await db.sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      return result;
    }
  },
  getSingleData: async (query) => {
    let result = await db.sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });
    return result[0];
  },
  updateWithValues: async (query, values) => {
    let result = await db.sequelize.query(query, {
      bind: values,
      type: sequelize.QueryTypes.INSERT,
    });
    return result;
  },
  selectWithValues: async (query, values) => {
    let result = await db.sequelize.query(query, {
      bind: values,
      type: sequelize.QueryTypes.SELECT,
    });
    return result;
  },

  insertNewToken: async (UserCredential, UserId, Token) => {
    let isInserted = false;
    const values = [
      UserCredential.FcmDeviceid,
      true,
      UserId,
      UserCredential.imei_no,
      UserCredential.Devicetype,
      UserCredential.DeviceInfo,
      UserCredential.VersionCode,
      UserCredential.VersionName,
      Token,
      UserCredential.EazyErpAppVersion,
      UserCredential.Username,
      UserCredential.loginappname,
    ];
    const sQuery = `
      INSERT INTO tbl_mobilesessiondetail(fcmid, isactiveuser, userid, imeinumber, devicetype, deviceinfo, versioncode, versionname, token, appversion, expiry_date, username, appname)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11, $12)
    `;

    let result = await db.sequelize.query(sQuery, {
      bind: values,
      type: sequelize.QueryTypes.INSERT,
    });

    isInserted = result.rowCount > 0;

    return isInserted;
  },
};

module.exports = postgreConnection;
