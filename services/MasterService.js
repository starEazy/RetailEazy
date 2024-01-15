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

  static async CreateCustomer(JsonObject) {
    writeLog("Start Create Customer API Json", JsonObject);

    let returndata = "";

    try {
      const dtresponse = [];
      const CreatedFrom = "APP";
      let Customer_id = "";
      const IsCreateType = await MasterService.getLedgerType();
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
            IsCreateType
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

          const result = await postgreConnection.query(squery);
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
          postgreConnection.ExecuteQuery(squeryLinking, "insert");
        }

        dtresponse.push({
          row_id: mstdetails.row_id,
          CustomerId,
          WebCustomerNo,
          customer_name: mstdetails.customer_name,
        });
      }

      await postgreConnection.TransCommit(tran, true, postgreConnection.Conn);
      returndata = JSON.stringify(dtresponse);

      if (IsCreateType === 1) {
        const DMSCustomerStatus = await CustomerMoveDMS(Customer_id);
      }
    } catch (ex) {
      await tran.rollback();
      dtresponse = null;
    }

    return returndata;
  }

  static async getLedgerType() {
    const squery =
      "SELECT COALESCE(ledgertype,0) as ledgertype FROM tbl_ledgermaster WHERE registrationid = $1 limit 1";
    const UserDetails = await postgreConnection.selectWithValues(squery, [
      tokenDetails.UserId,
    ]);
    if (parseInt(UserDetails.rows[0].ledgertype) === 0) {
      return 0;
    } else if (parseInt(UserDetails.rows[0].ledgertype) === 1) {
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

  static async getLedgerDetailsByType(brand_id, IsCreateType) {
    const squery =
      "SELECT ledgercode,ledgerid FROM tbl_ledgermaster WHERE registrationid = $1 AND brandid = $2 AND ledgertype = $3";
    return await postgreConnection.selectWithValues(squery, [
      tokenDetails.UserId,
      brand_id,
      IsCreateType,
    ]);
  }

  static async CustomerMoveDMS(Customer_id) {
    // Implementation of CustomerMoveDMS function
  }
}

module.exports = MasterService;
