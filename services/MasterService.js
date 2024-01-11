"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");

class MasterService {
  static async MasterData(objval, masterName) {
    let tokenDetails = {
      UserId: 5,
    };
    writeLog(
      `---Alter On AND PageIndex---${objval.alteredon} ${
        objval.pageindexno
      } ---Start Time--${new Date()}`
    );

    let result = "";
    const alteredon = objval.alteredon.slice(0, 19).replace("T", " "); // Format date as 'yyyy-MM-dd HH:mm:ss'
    console.log(">>>>>>>>>>>>", alteredon);
    const sQuery = `SELECT * FROM getmaster('${alteredon}', ${tokenDetails.UserId}, '${masterName}', ${objval.pageindexno}, '${objval.processtype}')`;
    writeLog(`---Get Master Data Query---${sQuery}`);

    try {
      const data = await postgreConnection.query(sQuery);

      console.log(">>>>>>>>>>>>data", data);

      if (data && data.length > 0) {
        result = data[0][0].toString();
        writeLog(
          `Return Api AlterOn Is ${
            objval.alteredon
          } --End Time Is--${new Date()} --Return No Of Count---${data.length}`
        );
      } else {
        writeLog("---Data Not Found---");
      }
    } catch (error) {
      console.error(error.message);
    }

    return result;
  }
}

module.exports = MasterService;
