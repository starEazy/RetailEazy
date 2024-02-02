"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");

const moment = require("moment");
const { writeLog } = require("../apps/helpers/utils");

module.exports = class OrderService {
  static async ItemStockPost(obj, userid) {
    try {
      writeLog("Start Item Stock API With Json " + JSON.stringify(obj));
      const dtresponse = {
        item: null,
        status: false,
        message: "",
      };
      const masterInsertQuery = `
            INSERT INTO tbl_itemstockmaster(brandid, createdby, synchedon, createdonapp, devicetype)
            VALUES($1, $2, NOW(), $3, $4)
            RETURNING masterid`;

      const masterParams = [
        obj.brandid,
        userid,
        moment(obj.synchedon).format("YYYY-MM-DD HH:mm:ss"),
        obj.Devicetype,
      ];

      const { masterid } = await postgreConnection.updateWithValues(
        masterInsertQuery,
        masterParams
      );

      if (masterid > 0) {
        for (const itemlist of obj.itemdetail) {
          const detailInsertQuery = `
                INSERT INTO tbl_itemstockdetail(masterid, itemid, baseunit, altunit, itemavailable, selectedunitid, divisionid)
                VALUES($1, $2, $3, $4, $5, $6, $7)
                RETURNING detailid`;

          const detailParams = [
            masterid,
            itemlist.itemid,
            itemlist.baseunit,
            itemlist.altunit,
            itemlist.itemavailable,
            itemlist.selectedunitid,
            _.isNull(itemlist.divisionid)
              ? null
              : parseInt(itemlist.divisionid, 10),
          ];

          await db.one(detailInsertQuery, detailParams);
        }
      }

      response.item = null;
      response.status = true;
      response.message = "Item Stock has been updated Successfully.";
      return response;
    } catch (ex) {
      response.item = null;
      response.status = false;
      response.message = "Item Stock Containing Some Error.";
      console.log(ex.message);
      return ex;
    }
  }

  static async createBilling(JsonObject, UserId, IsError) {
    let response = "";
    let invoiceids = "";
    const client = new Client();

    try {
      await client.connect();
      const tran = await client.query("BEGIN");

      const requeststr = JSON.stringify(JsonObject);
      if (!requeststr) {
        return null;
      }

      const requestParam = JSON.parse(requeststr);

      const dtresponse = {
        RowId: [],
        billing_id: [],
        billing_no: [],
        brandid: [],
      };

      for (const mstdetails of requestParam.MasterDetail) {
        let squery = `
                SELECT COUNT(1), MAX(billingmasterid) AS billingmasterid
                FROM tbl_billingmaster
                WHERE brandid = ${mstdetails.brandid}
                AND sellerid = ${mstdetails.sellerid}
                AND vch_no = '${mstdetails.vch_no}'
                AND vch_date = '${mstdetails.vch_date}'
                AND LOWER(tran_type) = 'sales'
                AND createdtype = 2`;

        const isCountStatus = await client.query(squery);
        if (isCountStatus.rows.length > 0) {
          if (isCountStatus.rows[0].count === 1) {
            await client.query("ROLLBACK");
            dtresponse.RowId.push(mstdetails.rowid);
            dtresponse.billing_id.push(isCountStatus.rows[0].billingmasterid);
            dtresponse.billing_no.push(mstdetails.vch_no);
            dtresponse.brandid.push(mstdetails.brandid);
            response = JSON.stringify(dtresponse);
            return response;
          } else if (isCountStatus.rows[0].count > 1) {
            await client.query("ROLLBACK");
            IsError = true;
            return "Entry No already exists";
          }
        }

        squery = `
                INSERT INTO tbl_billingmaster(
                    sellerid,
                    customerid,
                    brandid,
                    vch_no,
                    vch_date,
                    tran_type,
                    createdby,
                    nettotal,
                    orderid,
                    remark,
                    createdtype,
                    devicetype,
                    totaltax,
                    customercode,
                    dmsorderno,
                    isdmsorder
                )
                VALUES (
                    ${mstdetails.sellerid},
                    ${parseInt(mstdetails.customerid)},
                    ${mstdetails.brandid},
                    '${mstdetails.vch_no}',
                    '${new Date(mstdetails.vch_date)
                      .toISOString()
                      .slice(0, 10)}',
                    'sales',
                    ${UserId},
                    ${mstdetails.nettotal},
                    '${mstdetails.orderid}',
                    '${mstdetails.remark}',
                    2,
                    ${isNull(mstdetails.Devicetype, "integer")},
                    ${isNull(mstdetails.total_tax, "decimal")},
                    '${mstdetails.customercode}',
                    '${mstdetails.dmsorderno}',
                    ${mstdetails.isdmsorder}
                )
                RETURNING billingmasterid`;

        const billingMasterResult = await client.query(squery);
        const billingmasterid = billingMasterResult.rows[0].billingmasterid;
        invoiceids = `${billingmasterid},${invoiceids}`;

        for (const itemdetails of mstdetails.ItemDetail) {
          // ... (similar logic for item details)
        }

        dtresponse.RowId.push(mstdetails.rowid);
        dtresponse.billing_id.push(billingmasterid);
        dtresponse.billing_no.push(mstdetails.vch_no);
        dtresponse.brandid.push(mstdetails.brandid);
      }

      await client.query("COMMIT");
      response = JSON.stringify(dtresponse);
      return response;
    } catch (error) {
      await client.query("ROLLBACK");
      IsError = true;
      response = null;
    }
  }

  static async PostOrder(JsonObject,UserId,EmployeeId, UserName){
    
  }

  static async PlaceOrderCancel(JsonObject, UserId){
    writeLog("Start Place Order Cancel API ");
    try {
      let requestStr = JSON.stringify(JsonObject);
      // writeLog(requeststr);  
      const requestParam = JSON.parse(requestStr);
      let objOrd;
      let dtOrderDetails = [];
      let dtresponse = [];
      let sQuery = "";
      // return
      
      for (const mstdetails of requestParam.MasterList) {
        sQuery = `SELECT om.orderid, apiorderno, om.orderno, om.orderdate, som.vendorid, som.brandid, sod.divisionid FROM tbl_ordermaster om INNER JOIN tbl_subordermaster som ON om.orderid = som.orderid INNER JOIN tbl_suborderdetail sod ON som.orderid = sod.orderid WHERE om.orderid = '${mstdetails.orderid}'`;
        dtOrderDetails = await postgreConnection.query(sQuery);

        sQuery = `SELECT COUNT(1) FROM tbl_billingmaster WHERE tran_type = 'sales' AND orderid <> 0 AND orderid = '${mstdetails.orderid}';`;
        const isCountResult = await postgreConnection.query(sQuery);
        const isCount = parseInt(isCountResult[0].count, 10);

        if(isCount>0){
          writeLog(`Transaction can not be canceled, billing already created ${dtOrderDetails[0].orderno}`);
          dtresponse.push({
            order_id: mstdetails.orderid,
            apiorderno: dtOrderDetails[0].apiorderno,
            weborder_no: dtOrderDetails[0].orderno,
            alter_on: '',
            errorstatus: 'Transaction can not be canceled.',
          });
          result = JSON.stringify(dtresponse);
          return result;
        }

        objOrd = {
          Web_OrderNo: dtOrderDetails[0].orderno,
          API_OrderNo: dtOrderDetails[0].apiorderno,
          OrderDate: dtOrderDetails[0].orderdate,
          DivisionId: dtOrderDetails[0].divisionid,
        };
        console.log(objOrd,'....objOrd',mstdetails.remarks,mstdetails.Devicetype);
        console.log(typeof(mstdetails.remarks));
        sQuery = `UPDATE tbl_subordermaster SET isrequestforcancellation = true,cancellationrequestremarks = '${mstdetails.remarks}',isrequestforcancellationdate=now(),cancelrequestapproveddevicetype=${mstdetails.Devicetype}  WHERE orderid =${mstdetails.orderid} returning suborderid`;
        console.log(sQuery, 'sQuery');
        let dataSub = await postgreConnection.query(sQuery,"update");
        let {suborderid} = dataSub[0][0];
        console.log(suborderid,',,suborderid');
        sQuery = `SELECT isrequestforcancellationdate FROM tbl_subordermaster WHERE orderid = ${mstdetails.orderid};`
        const dtCancleApproveDate = await postgreConnection.query(sQuery);
        let CancleApproveDate = dtCancleApproveDate[0].isrequestforcancellationdate;
        objOrd.CancleApproveDate = CancleApproveDate;
        objOrd.CancleApproveDate == "" ? objOrd.CancleApproveDate : new Date(objOrd.CancleApproveDate)
        let alterOn = new Date().toISOString();
        dtresponse.push({ 
          order_id: mstdetails.orderid,
          apiorderno: objOrd.API_OrderNo,
          weborder_no: objOrd.Web_OrderNo,
          alter_on: alterOn,
          errorstatus: '',
        });
      }

      sQuery = `SELECT fcmid,appname FROM tbl_mobilesessiondetail WHERE userid= ${ dtOrderDetails[0].vendorid} order by id desc limit 1;`;
      const dtSendNotficn = await postgreConnection.query(sQuery);
      console.log(dtSendNotficn,'....dtSendNotficn');

      if (dtSendNotficn.length > 0) {
        sQuery = `SELECT brandname FROM tbl_brandmaster WHERE brandid = '${dtOrderDetails[0].brandid}';`;
        let dtBrandName = await postgreConnection.query(sQuery);
        console.log(dtBrandName,'....dtBrandName');
        objOrd.BrandName = dtBrandName[0].brandname;
        objOrd.BrandId = dtOrderDetails[0].brandid.toString();
        objOrd.OrderDate == "" ? objOrd.OrderDate : new Date(objOrd.OrderDate)
        
        sQuery = `select tl.ledgername from tbl_userdesignationmapping tu inner join tbl_ledgermaster tl on tu.dmsledgercode  = tl.ledgercode and tu.brandid = ${objOrd.BrandId} and tl.brandid =${objOrd.BrandId} and `;
        let dtUserName = await postgreConnection.query(sQuery+`tu.userid = ${UserId}`)
        console.log(objOrd,'....objORd3');
        console.log(dtUserName,'...dtUserName');
        // objOrd.UserName = dtUserName[0]["ledgername"];
        
        let dtCustName = await postgreConnection.query(sQuery + `tu.userid = ${ dtOrderDetails[0]["vendorid"]} `);
        console.log(dtCustName,'....dtCustName');
        objOrd.CustomerName = "";
        if (dtCustName.length == 1)
        {
          objOrd.CustomerName = dtCustName[0]["ledgername"];
        }
        else
        {
          objOrd.CustomerName = objOrd.BrandName;
        }
        sQuery = `select td.divisionid ,td.divisioncode ,td.divisionname from tbl_divisionmaster td where td.brandid =${objOrd.BrandId} and td.divisionid =${objOrd.DivisionId}`;
        let dtdivisiondetail =await postgreConnection.query(sQuery);
        if (dtdivisiondetail != "" && dtdivisiondetail.length > 0)
        {
          objOrd.DivisionId =dtdivisiondetail[0]["divisionid"];
          objOrd.DivisionCode = dtdivisiondetail[0]["divisioncode"];
          objOrd.DivisionName = dtdivisiondetail[0]["divisionname"];
        }
        console.log(objOrd,'....objORd5');
        sQuery = `select notification_body,notification_subject from tbl_notification_data where  notification_type ='DealerCancleOrder' and brandid  = ${objOrd.BrandId};`;
        let dtNotification = await postgreConnection.query(sQuery);
        if (dtNotification.length == 0)
        {
          sQuery =`select notification_body,notification_subject from tbl_notification_data where  notification_type ='DealerCancleOrder' and brandid='0'`;
          dtNotification = await postgreConnection.query(sQuery);
        }
        objOrd.Notification_Body = dtNotification[0]["notification_body"];
        objOrd.Notification_Subject = dtNotification[0]["notification_subject"];
        objOrd.Notification_Body = objOrd.Notification_Body.replace("{#distributorname#}", objOrd.CustomerName)
          .replace("{#dealername#}", objOrd.UserName)
          .replace("{#APIOrderNo#}", objOrd.API_OrderNo)
          .replace("{#OrderDate#}", objOrd.OrderDate)
          .replace("{#OrderCancelDate#}", objOrd.CancleApproveDate)
          .replace("{#BrandName#}", objOrd.BrandName)
          .replace("{#BrandId#}", objOrd.BrandId)
          .replace("{#DivisionName#}", objOrd.DivisionName);
        
        console.log(objOrd,'....objORd6');
        writeLog("Notification PlaceOrderCancel " + dtSendNotficn[0]["fcmid"] + " " + objOrd.Notification_Body);
        let AppName = dtSendNotficn[0]["appname"];
        console.log(AppName,'AppName');
        console.log(objOrd,'....objORd7');
        let objFcm;
        var json = JSON.stringify(objOrd);
        objFcm = {
          to: dtSendNotficn[0]["fcmid"],
          data:{
            message:json,
            type: objOrd.Notification_Subject
          }
        }
        // console.log(objFcm,'....objFcm');
        // await SendRequestGoogleApi(objFcm, parseInt(dtOrderDetails[0]["brandid"]), AppName);
        // WriteLog(objFcm.ToString());


        // ... (continue with the rest of the code)
      }

      let result = JSON.stringify(dtresponse);
      // console.log(result,'.....result');
      return result;
    } catch (e) {
      console.log(e);
    }
  }

  static async ReceivedOrderCancel(JsonObject, UserId){
    writeLog("Start Received Order Cancel API ");
    try {
      let requestStr = JSON.stringify(JsonObject);
      // writeLog(requeststr);  
      const requestParam = JSON.parse(requestStr);
      let objOrd;
      let dtOrderDetails = [];
      let dtresponse = [];
      let sQuery = "";
      // return
      
      for (const mstdetails of requestParam.MasterList) {
        sQuery = `SELECT om.orderid,apiorderno,om.orderno,om.orderdate,som.partyid,som.brandid,sod.divisionid FROM tbl_ordermaster om INNER JOIN tbl_subordermaster som on om.orderid = som.orderid inner join tbl_suborderdetail sod on  som.orderid = sod.orderid WHERE om.orderid = '${mstdetails.orderid}'`;
        dtOrderDetails = await postgreConnection.query(sQuery);

        sQuery = `SELECT COUNT(1) FROM tbl_billingmaster WHERE tran_type = 'sales' AND orderid <> 0 AND orderid = '${mstdetails.orderid}';`;
        const isCountResult = await postgreConnection.query(sQuery);
        const isCount = parseInt(isCountResult[0].count, 10);

        if(isCount>0){
          writeLog(`Transaction can not be canceled, billing already created ${dtOrderDetails[0].orderno}`);
          dtresponse.push({
            order_id: mstdetails.orderid,
            apiorderno: dtOrderDetails[0].apiorderno,
            weborder_no: dtOrderDetails[0].orderno,
            alter_on: '',
            errorstatus: 'Transaction can not be canceled.',
          });
          result = JSON.stringify(dtresponse);
          return result;
        }

        objOrd = {
          Web_OrderNo: dtOrderDetails[0].orderno,
          API_OrderNo: dtOrderDetails[0].apiorderno,
          OrderDate: dtOrderDetails[0].orderdate,
          DivisionId: dtOrderDetails[0].divisionid,
        };
        // sQuery = `UPDATE tbl_subordermaster SET iscancellationrequestapproved = '" + mstdetails.type + "',cancellationrequestapprovedremakrs = '" + mstdetails.remarks + "',iscancellationrequestapproveddate=now(),cancelrequestapproveddevicetype=" + IsNull(mstdetails.Devicetype, VarType.Integer) + " WHERE orderid =" + mstdetails.orderid + " returning suborderid`;
        // writeLog(`Received Order Update Query ${sQuery}`);
        // const suborderId = await postgreConnection.query(sQuery,'update');
        // console.log(suborderId,',,suborderid');
        sQuery = `SELECT iscancellationrequestapproveddate FROM tbl_subordermaster WHERE orderid = ${mstdetails.orderid};`
        const dtCancleApproveDate = await postgreConnection.query(sQuery);
        let CancleApproveDate = dtCancleApproveDate[0].iscancellationrequestapproveddate;
        objOrd.CancleApproveDate == "" ? objOrd.CancleApproveDate : new Date(objOrd.CancleApproveDate)
        writeLog(`Received Order Get Cancle OrderDate ${sQuery}`);
        objOrd.CancleApproveDate = CancleApproveDate;
        let alterOn = new Date().toISOString();
        dtresponse.push({ 
          order_id: mstdetails.orderid,
          apiorderno: objOrd.API_OrderNo,
          weborder_no: objOrd.Web_OrderNo,
          alter_on: alterOn,
          errorstatus: '',
        });
        notificationquery = `select notification_body,notification_subject from tbl_notification_data where  notification_type ='DistributorApproveOrder' and brandid  = ${dtOrderDetails[0]["brandid"]};`;
        if (mstdetails.type == 2) {
          notificationquery = `select notification_body,notification_subject from tbl_notification_data where  notification_type ='DistributorCancelOrder' and brandid  = ${dtOrderDetails[0]["brandid"]};`;
        }
        dtNotification = postgreConnection.query(notificationquery);

        if (dtNotification.length == 0) {
            notificationquery = `select notification_body,notification_subject from tbl_notification_data where  notification_type ='DistributorApproveOrder' and brandid  = '0';`;
            if (mstdetails.type == 2) {
              notificationquery = `select notification_body,notification_subject from tbl_notification_data where  notification_type ='DistributorCancelOrder' and brandid  = '0';`;
            }
            dtNotification = postgreConnection.query(notificationquery);
        }
      }
      sQuery = `SELECT fcmid,appname FROM tbl_mobilesessiondetail WHERE userid= ${ dtOrderDetails[0].partyid} order by id desc limit 1;`;
      const dtSendNotficn = await postgreConnection.query(sQuery);
      if (dtSendNotficn.length > 0) {
        sQuery = `SELECT brandname FROM tbl_brandmaster WHERE brandid = '${dtOrderDetails[0].brandid}';`;
        let dtBrandName = await postgreConnection.query(sQuery);
        console.log(dtBrandName,'....dtBrandName');
        objOrd.BrandName = dtBrandName[0].brandname;
        objOrd.BrandId = dtOrderDetails[0].brandid.toString();
        objOrd.OrderDate == "" ? objOrd.OrderDate : new Date(objOrd.OrderDate)
        
        sQuery = `select tl.ledgername from tbl_userdesignationmapping tu inner join tbl_ledgermaster tl on tu.dmsledgercode  = tl.ledgercode and tu.brandid = ${objOrd.BrandId} and tl.brandid =${objOrd.BrandId} and `;
        let dtUserName = await postgreConnection.query(sQuery+`tu.userid = ${dtOrderDetails[0]["partyid"]}`)
        console.log(objOrd,'....objORd3');
        console.log(dtUserName,'...dtUserName');
        // objOrd.UserName = dtUserName[0]["ledgername"];
        
        let dtCustName = await postgreConnection.query(sQuery + `tu.userid = ${UserId} `);
        // console.log(dtCustName,'....dtCustName');
        objOrd.CustomerName = "";
        if (dtCustName.length == 1)
        {
          objOrd.CustomerName = dtCustName[0]["ledgername"];
        }
        else
        {
          objOrd.CustomerName = objOrd.BrandName;
        }
        sQuery = `select td.divisionid ,td.divisioncode ,td.divisionname from tbl_divisionmaster td where td.brandid =${objOrd.BrandId} and td.divisionid =${objOrd.DivisionId}`;
        let dtdivisiondetail =await postgreConnection.query(sQuery);
        if (dtdivisiondetail != "" && dtdivisiondetail.length > 0)
        {
          objOrd.DivisionId =dtdivisiondetail[0]["divisionid"];
          objOrd.DivisionCode = dtdivisiondetail[0]["divisioncode"];
          objOrd.DivisionName = dtdivisiondetail[0]["divisionname"];
        }
        objOrd.Notification_Body = dtNotification[0]["notification_body"];
        objOrd.Notification_Subject = dtNotification[0]["notification_subject"];
        objOrd.Notification_Body = objOrd.Notification_Body.replace("{#distributorname#}", objOrd.CustomerName)
          .replace("{#dealername#}", objOrd.UserName)
          .replace("{#APIOrderNo#}", objOrd.API_OrderNo)
          .replace("{#OrderDate#}", objOrd.OrderDate)
          .replace("{#OrderCancelDate#}", objOrd.CancleApproveDate)
          .replace("{#BrandName#}", objOrd.BrandName)
          .replace("{#BrandId#}", objOrd.BrandId)
          .replace("{#DivisionName#}", objOrd.DivisionName);
        
        // console.log(objOrd,'....objORd6');
        writeLog("Notification ReceivedOrderCancel " + dtSendNotficn[0]["fcmid"] + " " + objOrd.Notification_Body);
        // let AppName = dtSendNotficn[0]["appname"];
        // console.log(AppName,'AppName');
        let objFcm;
        var json = JSON.stringify(objOrd);
        objFcm = {
          to: dtSendNotficn[0]["fcmid"],
          data:{
            message:json,
            type: objOrd.Notification_Subject
          }
        }
        // console.log(objFcm,'....objFcm');
        await SendRequestGoogleApi(objFcm, parseInt(dtOrderDetails[0]["brandid"]), AppName);
        // WriteLog(objFcm.ToString());


        // ... (continue with the rest of the code)
      }
    } catch (e) {
      
    }

  }



  static async SendRequestGoogleApi(obj="", L_brandid = 0, appname = ""){
    let result = false;
    let url = "";
    let apiResponse = "";
    let data = ""
    try {
      console.log('some');
      url = "https://fcm.googleapis.com/fcm/send";

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': appname.includes('Pragati Path')
            ? 'key=AAAAXdkdE6E:APA91bHIoq0_TJANy0H0Y0f1RC15VoBaOsLtyNoEWrB2shNhzPveK3VnoLBp0nM0yaHBgaegDVhw1ctPZsp_s6my6T-IuwyCAy5GRDyTu4y50nqpQSQ4lc7Oc7ZJCyjYYJr4GdsvLv6Z'
            : 'key=AAAAk9p1Hog:APA91bEJig2kQmbnKPUx9DIZP5zkEd4LX4_bLa29F3uiiU1xD79rAlqr8t8sHob_vTtE6NmFCbffTnxFrn0fgh1Nb04HCBLxY1yQTx2FGRbc1XdYnEY-lt7BQQqHMEZ4PKW7IXCWdOR5',
      };

      if(appname.contain("Pragati Path")){
        headers.add("Authorization", "key=AAAAXdkdE6E:APA91bHIoq0_TJANy0H0Y0f1RC15VoBaOsLtyNoEWrB2shNhzPveK3VnoLBp0nM0yaHBgaegDVhw1ctPZsp_s6my6T-IuwyCAy5GRDyTu4y50nqpQSQ4lc7Oc7ZJCyjYYJr4GdsvLv6Z")
      } else{
        headers.add("Authorization", "key=AAAAk9p1Hog:APA91bEJig2kQmbnKPUx9DIZP5zkEd4LX4_bLa29F3uiiU1xD79rAlqr8t8sHob_vTtE6NmFCbffTnxFrn0fgh1Nb04HCBLxY1yQTx2FGRbc1XdYnEY-lt7BQQqHMEZ4PKW7IXCWdOR5");
      }
      console.log(`SendRequestGoogleApi ${L_brandid}`);

      const response = await axios.post(url, obj, { headers });

      apiResponse = response.data;
      const objRes = JSON.parse(apiResponse);

      if (objRes.success) {
          result = true;
      } else {
          result = false;
      }
    } catch (e) {
      
    }
  }
};
