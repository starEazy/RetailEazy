"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");

class MasterService {
  static async MasterData(objval, masterName, user_id) {
    let tokenDetails = {
      UserId: user_id,
    };
    writeLog(
      `---Alter On AND PageIndex---${objval.alteredon} ${
        objval.pageindexno
      } ---Start Time--${new Date()}`
    );

    let result = "";
    const alteredon = objval.alteredon.slice(0, 19).replace("T", " "); // Format date as 'yyyy-MM-dd HH:mm:ss'
    const sQuery = `SELECT * FROM getmaster('${alteredon}', ${tokenDetails.UserId}, '${masterName}', ${objval.pageindexno}, '${objval.processtype}')`;

    console.log(">>>>>>>>>>>>", sQuery);

    writeLog(`---Get Master Data Query---${sQuery}`);

    const data = await postgreConnection.query(sQuery);

    console.log(">>>>>>>>>>>>data", data);

    if (data && data.length > 0) {
      result = JSON.parse(data[0].getmaster);
      writeLog(
        `Return Api AlterOn Is ${
          objval.alteredon
        } --End Time Is--${new Date()} --Return No Of Count---${data.length}`
      );
    } else {
      writeLog("---Data Not Found---");
    }

    return result;
  }
}

module.exports = MasterService;
