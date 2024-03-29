"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");

class DMSMasterService {
    static async GetPIOrderFromDms(JsonObject,trantype){
      const requeststr = JsonObject;
      if(requeststr == ""){
        return ""
      }
      let QueryToexecute = "";
      QueryToexecute = "SELECT * FROM getpiorderdatafromdms('" + requeststr.alteredon.toString("yyyy-MM-dd HH:mm:ss") + "','" + trantype + "'," + requeststr.pageindexno + ",'" + requeststr.LedgerCode + "','" + requeststr.DesignationName + "','" + requeststr.BrandCode + "')";
      writeLog(`GetPIOrderFromDms Query${QueryToexecute}`);
      var UploadJson = await postgreConnection.query(QueryToexecute);
      return UploadJson;
    }
    static async GetDistributorOrderFromDms(JsonObject,trantype){
      const requeststr = JsonObject;
      if(requeststr == ""){
        return ""
      }
      writeLog(`getpiorderdatafromdms ${requeststr.toString()} + requeststr`)
      let QueryToexecute = "";
      QueryToexecute = "SELECT * FROM getpiorderdatafromdms('" + requeststr.alteredon.toString("yyyy-MM-dd HH:mm:ss") + "','" + trantype + "'," + requeststr.pageindexno + ",'" + toString(requeststr.LedgerCode) + "','" + toString(requeststr.DesignationName) + "','" + toString(requeststr.BrandCode) + "')";
      writeLog(`GetDistributorOrderFromDms Query  ${QueryToexecute}`);
      var UploadJson = await postgreConnection.query(QueryToexecute);
      return UploadJson;
    }
  }

  module.exports = DMSMasterService;
  