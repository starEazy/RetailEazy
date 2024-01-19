"use strict";
const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");

class InvoiceService {
  static async GetOrderJson(objparm, Userid, masterName) {
    writeLog("Start Get Order/Billing API ");
    let sQuery = `SELECT * FROM getbillingdetail('${objparm.alteredon}',${Userid},'${masterName}','${objparm.pageindexno}')`;
    writeLog(`Get Order/Billing Execute Function ${sQuery}`);
    let result = postgreConnection.query(sQuery);
    return result;
  }
  static async saveInvoiceDetails() {}
}

module.exports = InvoiceService;
