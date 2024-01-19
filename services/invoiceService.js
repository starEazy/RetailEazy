"use strict";
const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");

class InvoiceService {
    static async GetOrderJson(objparm,Userid, masterName){
        let result = "";
        writeLog("Start Get Order/Billing API ");
        let sQuery = "";
        if (masterName == "BILLING") {
            sQuery = "SELECT * FROM getbillingdetail('" + objparm.alteredon.toString("yyyy-MM-dd HH:mm:ss") + "'," + Userid + ",'" + toString(masterName) + "'," + objparm.pageindexno + ")";
        } else if (masterName == "PURCHASEINVOICE") {
            sQuery = "SELECT * FROM getbillingdetail('" + objparm.alteredon.toString("yyyy-MM-dd HH:mm:ss") + "'," + Userid + ",'" + toString(masterName) + "'," + objparm.pageindexno + ")";
        } else {
            sQuery = "SELECT * FROM getOrder('" + objparm.alteredon.toString("yyyy-MM-dd HH:mm:ss") + "'," + Userid + ",'" + toString(masterName) + "'," + objparm.pageindexno + ")";
        }
        writeLog(`Get Order/Billing Execute Function ${sQuery}`);
        result = postgreConnection.query(sQuery.toString());
        return result;
    }
  static async saveInvoiceDetails() {}
}

module.exports = InvoiceService;
