"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");
const moment = require("moment");
const axios = require("axios");
const { error } = require("winston");

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

    writeLog(`---Get Master Data Query---${sQuery}`);

    const data = await postgreConnection.query(sQuery);

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

  static async CreateCustomer(objval, user_id) {
    try {
      let tokenDetails = {
        UserId: user_id,
      };
      let JsonObject = {
        CustomerDetail: [objval],
      };

      writeLog("Start Create Customer API Json", JsonObject);

      let returndata = "";

      const dtresponse = [];
      const CreatedFrom = "APP";
      let Customer_id = "";
      const IsCreateType = await MasterService.getLedgerType(tokenDetails);
      if (IsCreateType === -1) {
        returndata = "Invalid process.";
        return returndata;
      }

      for (const mstdetails of JsonObject.CustomerDetail) {
        let WebCustomerNo = "";
        let CustomerId = 0;
        const squeryDL = await MasterService.getLedgerDetails(
          mstdetails.customer_name,
          mstdetails.brand_id,
          mstdetails.address
        );

        if (squeryDL.length > 0) {
          WebCustomerNo = squeryDL[0].ledgercode;
          CustomerId = squeryDL[0].ledgerid;
          Customer_id = `${CustomerId},${Customer_id}`;
        } else {
          const squeryDLDetails = await MasterService.getLedgerDetailsByType(
            mstdetails.brand_id,
            IsCreateType,
            tokenDetails
          );

          let squery = "";
          if (IsCreateType === 1) {
            squery = `INSERT INTO tbl_ledgermaster(brandid,ledgername,mobileno,address,pincode,emailid,gstnno,createdby,cityid,stateid,countryid,panno,upi_id,paytmmobileno,designation_id,margin,ledgertype,createdfrom) 
                      VALUES (${mstdetails.brand_id},'${mstdetails.customer_name}','${mstdetails.contact_no}','${mstdetails.address}','${mstdetails.pincode}','${mstdetails.email_id}','${mstdetails.gstin_no}','${tokenDetails.UserId}',
                      '${mstdetails.city_id}','${mstdetails.state_id}','${mstdetails.country_id}','${mstdetails.pan_no}','${mstdetails.upi_id}','${mstdetails.paytm_mob_no}',${mstdetails.designation_id},${mstdetails.margin},0,'${CreatedFrom}') 
                      RETURNING ledgerid`;
          } else if (IsCreateType === 0) {
            squery = `INSERT INTO tbl_ledgermaster(brandid,ledgername,mobileno,address,pincode,emailid,gstnno,createdby,cityid,stateid,countryid,panno,upi_id,paytmmobileno,designation_id,margin,ledgertype,createdfrom) 
                      VALUES (${mstdetails.brand_id},'${mstdetails.customer_name}','${mstdetails.contact_no}','${mstdetails.address}','${mstdetails.pincode}','${mstdetails.email_id}','${mstdetails.gstin_no}','${tokenDetails.UserId}',
                      '${mstdetails.city_id}','${mstdetails.state_id}','${mstdetails.country_id}','${mstdetails.pan_no}','${mstdetails.upi_id}','${mstdetails.paytm_mob_no}',${mstdetails.designation_id},${mstdetails.margin},4,'${CreatedFrom}') 
                      RETURNING ledgerid`;
          }

          const result = await postgreConnection.query(squery, "insert");
          CustomerId = parseInt(result[0]);

          WebCustomerNo = await postgreConnection.query(
            `UPDATE tbl_ledgermaster 
                                                              SET ledgercode='DLR' || lpad(cast(ledgerid as text),10,'0'),
                                                              app_ledgercode='APP-DLR' || lpad(cast(ledgerid as text),10,'0'),
                                                              devicetype=${mstdetails.Devicetype} 
                                                              WHERE ledgerid=${CustomerId} 
                                                              RETURNING ledgercode`,
            "update"
          );

          const squeryLinking = `INSERT INTO tbl_ledgerlinking(brandid,distributorid,dealerid,distributorcode,dealercode,createdon,isactive) 
                                  VALUES (${mstdetails.brand_id},${squeryDLDetails[0].ledgerid},${CustomerId},'${squeryDLDetails[0].ledgercode}','${WebCustomerNo}',Current_timestamp,true)`;
          postgreConnection.query(squeryLinking, "insert");
        }

        dtresponse.push({
          row_id: mstdetails.row_id,
          CustomerId,
          WebCustomerNo,
          customer_name: mstdetails.customer_name,
        });
      }
      // await postgreConnection.TransCommit(tran, true, postgreConnection.Conn);
      returndata = JSON.parse(JSON.stringify(dtresponse));

      if (IsCreateType === 1) {
        await MasterService.CustomerMoveDMS(Customer_id);
      }

      return returndata;
    } catch (err) {
      console.log(err);
    }
  }

  static async getLedgerType(tokenDetails) {
    const squery =
      "SELECT COALESCE(ledgertype,0) as ledgertype FROM tbl_ledgermaster WHERE registrationid = $1 limit 1";
    const UserDetails = await postgreConnection.selectWithValues(squery, [
      tokenDetails.UserId,
    ]);

    if (parseInt(UserDetails[0].ledgertype) === 0) {
      return 0;
    } else if (parseInt(UserDetails[0].ledgertype) === 1) {
      return 1;
    } else {
      return -1;
    }
  }

  static async getLedgerDetails(customer_name, brand_id, address) {
    const squery =
      "SELECT ledgercode,ledgerid FROM tbl_ledgermaster WHERE lower(ledgername) = $1 AND brandid = $2 AND lower(address) = $3";
    return await postgreConnection.selectWithValues(squery, [
      customer_name.toLowerCase().trim(),
      brand_id,
      address.toLowerCase().trim(),
    ]);
  }

  static async getLedgerDetailsByType(brand_id, IsCreateType, tokenDetails) {
    const squery =
      "SELECT ledgercode,ledgerid FROM tbl_ledgermaster WHERE registrationid = $1 AND brandid = $2 AND ledgertype = $3";
    return await postgreConnection.selectWithValues(squery, [
      tokenDetails.UserId,
      brand_id,
      IsCreateType,
    ]);
  }

  static async CustomerMoveDMS(Customer_id) {
    try {
      writeLog(
        `Start Customer Move to DMS Customer No ${Customer_id.toString()}`
      );

      const Token = ""; // Set the actual value of the token here

      let MstQuery = "";
      let DTBrand = [];

      if (Customer_id.trim().length > 1) {
        Customer_id = Customer_id.substring(0, Customer_id.length - 1);
      }

      if (Customer_id.trim() !== "") {
        MstQuery = `SELECT distinct brandid FROM tbl_ledgermaster WHERE ledgerid in (${Customer_id});`;
        writeLog(`Select Brand ID Based on Customer No ${MstQuery}`);

        const brandResult = await postgreConnection.query(MstQuery);
        DTBrand = brandResult || [];

        for (let i = 0; i < DTBrand.length; i++) {
          MstQuery = `SELECT brand_url FROM tbl_brandmaster WHERE brandid  = ${DTBrand[i].brandid}`;
          writeLog(`Brand URL Based on Brand Id ${MstQuery}`);

          const brandURLResult = await postgreConnection.query(MstQuery);
          const BrandURL = brandURLResult[0].brand_url;

          MstQuery = `
          SELECT
            lm.ledgerid,
            lm.ledgercode,
            lm.ledgername,
            lm.mobileno,
            lm.emailid,
            lm.gstnno,
            lm.panno,
            lm.address,
            lm.cityid,
            lm.stateid,
            lm.countryid,
            lm.pincode,
            lm.designation_id,
            dsled.masterid as distributorid,
            dsled.ledgercode as distributorcode,
            COALESCE(cm.citycode, '') as citycode,
            COALESCE(sm.statecode, '') as statecode
          FROM tbl_ledgermaster lm
          LEFT JOIN tbl_citymaster cm ON lm.cityid = cm.cityid AND cm.brandid = ${DTBrand[i].brandid}
          LEFT JOIN tbl_statemaster sm ON lm.stateid = sm.stateid AND sm.brandid = ${DTBrand[i].brandid}
          LEFT JOIN tbl_ledgermaster dsled ON lm.createdby = dsled.registrationid AND dsled.brandid = ${DTBrand[i].brandid}
          WHERE lm.brandid = ${DTBrand[i].brandid} and lm.ledgerid in (${Customer_id})
        `;
          writeLog(`Get Customer Master Query ${MstQuery}`);

          const dtMasterResult = await postgreConnection.query(MstQuery);
          const dtMaster = dtMasterResult || [];

          const JSONString = JSON.stringify(dtMaster);
          writeLog(`Customer DMS Json ${JSONString}`);

          const DMSCustomerStatus = await axios.post(
            `${BrandURL}/api/Master/DMSCustomerPost`,
            JSONString,
            {
              headers: {
                "Content-Type": "application/json",
                Token: Token,
              },
            }
          );

          const resp_result = DMSCustomerStatus.data.multipleresult;
          resp_result.forEach((rep) => {
            if (rep.status.toString().toLowerCase() === "true") {
              Customer_id = rep.id.toString();
              postgreConnection.query(
                `Update tbl_ledgermaster set isdmssync=true, alteredon = CURRENT_TIMESTAMP WHERE ledgertype=0 and createdfrom='APP'   AND ledgerid in (${Customer_id}) `,
                "update"
              );
            } else {
              writeLog(`ORDER APP TO DMS Catch Error ${rep.respmessage}`);
            }
          });
        }
      }
    } catch (ex) {
      writeLog(`DMS Customer Catch Error ${ex.message}`);
      return false;
    }
    return true;
  }

  static async dmssyncstatusData(objval) {
    let result = "";
    let squery = "";
    let tran_type = "";
    const requeststr = JSON.stringify(objval);

    try {
      const requestParam = JSON.parse(requeststr);
      writeLog(
        `---DmssyncstatusData Req --${requestParam.MasterIds} ${
          requestParam.ModelName
        } ---Start Time--${moment().format("YYYY-MM-DD HH:mm:ss")}`
      );

      if (requestParam.ModelName === "order") {
        squery = `SELECT orderid as masterid, isdmssync as dmssync, to_char(alteredon, 'yyyy-mm-dd HH24:mi:ss') as alteredon FROM tbl_subordermaster WHERE orderid IN (${requestParam.MasterIds})`;
      } else {
        if (requestParam.ModelName === "purchase invoice") {
          tran_type = "purchase invoice','Primary PI";
        }
        if (requestParam.ModelName === "billing") {
          tran_type = "sales";
        }

        squery = `SELECT billingmasterid as masterid, CASE WHEN COALESCE(createdtype, 0) = 1 THEN TRUE ELSE isdmssync END as dmssync, to_char(alteredon, 'yyyy-mm-dd HH24:mi:ss') as alteredon FROM tbl_billingmaster WHERE billingmasterid IN (${requestParam.MasterIds}) AND tran_type IN ('${tran_type}') AND createdtype = 2`;
      }

      const queryResult = await postgreConnection.query(
        `SELECT json_agg(row_to_json(t)) FROM (${squery}) as t`
      );

      const dt = queryResult[0].json_agg;

      if (dt) {
        if (dt.length > 0) {
          result = dt[0];
          writeLog(
            `Return Api MasterIds Is ${
              requestParam.MasterIds
            } --End Time Is--${moment().format(
              "YYYY-MM-DD HH:mm:ss"
            )} --Return No Of Count---${dt.length}`
          );
        } else {
          writeLog("---Data Not Found---");
        }
      } else {
        return null;
      }
    } catch (error) {
      console.log("Error in dmssyncstatusData:", error);
    }

    return result;
  }
}

module.exports = MasterService;
