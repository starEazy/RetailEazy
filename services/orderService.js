"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");
const axios = require("axios");
const moment = require("moment");
const { writeLog } = require("../apps/helpers/utils");

module.exports = class OrderService {
  static async ItemStockPost(obj, userid) {
    const response = {
      item: null,
      status: false,
      message: "",
    };
    try {
      writeLog(`Start Item Stock API With Json  + ${JSON.stringify(obj)}`);
      const masterInsertQuery = `
            INSERT INTO tbl_itemstockmaster(brandid, createdby, synchedon, createdonapp, devicetype)
            VALUES($1, $2, $3, $4, $5)
            RETURNING masterid`;

      const masterParams = [
        obj.brandid,
        userid,
        "NOW()",
        moment(obj.synchedon).format("YYYY-MM-DD HH:mm:ss"),
        obj.Devicetype,
      ];

      const result = await postgreConnection.updateWithValues(
        masterInsertQuery,
        masterParams
      );

      let { masterid } = result[0][0];

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
            itemlist.divisionid == null ? 10 : itemlist.divisionid,
          ];

          await postgreConnection.updateWithValues(
            detailInsertQuery,
            detailParams
          );
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
    writeLog("Start Billing API Json " + JsonObject);
    let IsCount = 0;
    let dtresponse = [];

    try {
      let squery = "";
      let billingmasterid = 0;
      let billingdetailid = 0;

      const requeststr = JSON.stringify(JsonObject);
      if (!requeststr) {
        return response = null;
      }
      const requestParam = JSON.parse(requeststr);

      for (const mstdetails of requestParam.MasterDetail) {
        squery = `SELECT COUNT(1), MAX(billingmasterid) AS billingmasterid FROM tbl_billingmaster WHERE brandid = ${mstdetails.brandid} AND sellerid = ${mstdetails.sellerid} AND vch_no = '${mstdetails.vch_no}' AND vch_date = '${mstdetails.vch_date}' AND LOWER(tran_type) = 'sales' AND createdtype = 2`;
        const isCountStatus = await postgreConnection.query(squery);
        if (isCountStatus.length > 0) {
          if (parseInt(isCountStatus[0]["count"]) === 1) {
            dtresponse.push({
              RowId: mstdetails.rowid,
              billing_id: isCountStatus.rows[0].billingmasterid,
              billing_no: mstdetails.vch_no,
              brandid: mstdetails.brandid,
            })
            return response;
          } else if (isCountStatus.rows[0].count > 1) {
            IsError = true;
            return "Entry No already exists";
          }
        }

        squery = `INSERT INTO tbl_billingmaster(sellerid,customerid,brandid,vch_no,vch_date,tran_type,createdby,nettotal,orderid,remark,createdtype,devicetype,totaltax,customercode,dmsorderno,isdmsorder) VALUES (${mstdetails.sellerid}, ${parseInt(mstdetails.customerid)}, ${mstdetails.brandid},'${mstdetails.vch_no}','${new Date(mstdetails.vch_date).toISOString().slice(0, 10)}','sales', ${UserId}, ${mstdetails.nettotal},'${mstdetails.orderid}','${mstdetails.remark}', 2,${isNull(mstdetails.Devicetype, "integer")},${isNull(mstdetails.total_tax, "decimal")}, '${mstdetails.customercode}', '${mstdetails.dmsorderno}', ${mstdetails.isdmsorder}) 
          returning billingmasterid`;
        writeLog("Billing Master Save Query " + squery);

        billingmasterid = parseInt(await postgreConnection.query(squery));
        // const billingmasterid = billingMasterResult.rows[0].billingmasterid;
        invoiceids = `${billingmasterid},${invoiceids}`;

        for (const itemdetails of mstdetails.ItemDetail) {
          let BaseUnit = 0;
          let AltUnit = 0;
          let Conversion = 0;
          let Denominator = 0;
          let israteonaltunit = false;

          squery = "select COALESCE(baseunitid,0) from tbl_itemmaster Where itemid=" + itemdetails.itemid + "";
          BaseUnit = parseInt(await postgreConnection.query(squery));
          writeLog(`BaseUnit ${BaseUnit}`);

          if (parseInt(BaseUnit) == 0) {
            writeLog("Item does not exist in our records.");
            IsError = true;
            return "Item does not exist in our records.";
          }

          squery = "select COALESCE(altunitid,0) from tbl_itemmaster Where itemid=" + itemdetails.itemid + "";
          AltUnit = parseInt(await postgreConnection.query(squery));
          writeLog(`AltUnit ${AltUnit}`);

          squery = "select COALESCE(conversion,0) from tbl_itemmaster Where itemid=" + itemdetails.itemid + "";
          Conversion = parseFloat(await postgreConnection.query(squery));
          writeLog(`Conversion ${Conversion}`);

          squery = "";
          squery = "select COALESCE(denominator,0) from tbl_itemmaster Where itemid=" + itemdetails.itemid + "";
          Denominator = parseFloat(await postgreConnection.query(squery));
          writeLog(`Denominator ${Denominator}`);

          let BaseQty = 0;
          let AltQty = 0;
          if (parseInt(itemdetails.unitid) === BaseUnit) {
            BaseQty = parseFloat(itemdetails.base_qty);
            AltQty = parseFloat(((Denominator / Conversion) * parseFloat(itemdetails.base_qty)).toFixed(5));
          }
          if (parseInt(itemdetails.unitid) === AltUnit) {
            BaseQty = parseFloat((Denominator * Conversion * parseFloat(itemdetails.base_qty)).toFixed(5)); // this is wrong.
            BaseQty = parseFloat(((parseFloat(itemdetails.base_qty) * Conversion) / Denominator).toFixed(5)); // Rectify while bunge checking 26-june 2023
            AltQty = parseFloat(itemdetails.base_qty);
            israteonaltunit = true;
          }

          squery = "INSERT INTO tbl_billingdetails(billingmasterid,itemid,divisionid,base_qty,alt_qty,rate,amount,unitid,israteonaltunit,grossamount,discountper,discountamount,gstassessablevalue,igstrate,cgstrate,sgstrate,igstamount,cgstamount,sgstamount,isdiscountaftertax,isinclusive,itemmrp,dmsitemcode,dmssodetailid) VALUES (" + billingmasterid + "," + itemdetails.itemid + "," + Configure.IsNull(itemdetails.divisionid, VarType.Integer) + "," + BaseQty + "," + AltQty + "," + itemdetails.rate + "," + itemdetails.amount + "," + itemdetails.unitid + "," + israteonaltunit + " ," + Convert.ToDecimal(itemdetails.grossamount) + "," + Convert.ToDecimal(itemdetails.discountper) + "," + Convert.ToDecimal(itemdetails.discountamount) + "," + Convert.ToDecimal(itemdetails.gstassessablevalue) + "," + Convert.ToDecimal(itemdetails.igstrate) + "," + Convert.ToDecimal(itemdetails.cgstrate) + "," + Convert.ToDecimal(itemdetails.sgstrate) + "," + Convert.ToDecimal(itemdetails.igstamount) + "," + Convert.ToDecimal(itemdetails.cgstamount) + "," + Convert.ToDecimal(itemdetails.sgstamount) + "," + IsNull(itemdetails.isdiscountaftertax, VarType.Bool) + "," + IsNull(itemdetails.isinclusive, VarType.Bool) + "," + IsNull(Convert.ToDecimal(itemdetails.item_mrp), VarType.Dec) + ",'" + Configure.IsNull(itemdetails.item_code, VarType.Text) + "'," + IsNull(itemdetails.dmssodetailid, VarType.Integer32) + ")  returning billingdetailid";
          writeLog("Billing Item Details Save Query " + squery);

          billingdetailid = parseInt(await postgreConnection.query(squery));

          for (const serialitem of itemdetails.serial_detail) {
            squery = "INSERT INTO tbl_billingitemserial(billingmasterid,billingdetailid,serial_id,batchcode,scancode,scantype) VALUES (" + billingmasterid + "," + billingdetailid + ",'" + serialitem.serial_id + "','" + serialitem.batchcode + "','" + serialitem.scancode + "','" + serialitem.scantype + "')  returning serialid";
            writeLog("Billing Item Details Save Query " + squery);

            let serialid = parseInt(await postgreConnection.query(squery));
          }
          if (itemdetails.ScanDetail != null) {
            for(const scan of itemdetails.ScanDetail) {
              squery = "INSERT INTO tbl_billingitemserial(billingmasterid,billingdetailid,serial_id,batchcode,scancode,scantype,iscarton) VALUES (" + billingmasterid + "," + billingdetailid + ",'" + scan.serial_id + "','" + scan.batchcode + "','" + scan.scancode + "','" + scan.scantype + "'," + Convert.ToBoolean(scan.iscarton) + ")  returning serialid";
              Configure.WriteLog("Purchase Invoice Scan Details Save Query " + squery);
              let serialid = parseInt(await postgreConnection.query(squery));
            }
          }
        }
        if(billingmasterid > 0){
          squery = " update tbl_suborderdetail set pendingqty = (qty - z.base_qty) ";
          squery = squery + " from(select z.orderid, z1.itemid, sum(base_qty) base_qty from tbl_billingmaster z ";
          squery = squery + " inner join tbl_billingdetails z1 on z.billingmasterid = z1.billingmasterid ";
          squery = squery + " where COALESCE(z.orderid, 0) <> 0  and z.billingmasterid = " + billingmasterid + " ";
          squery = squery + " Group by z.orderid, z1.itemid) z ";
          squery = squery + " Where tbl_suborderdetail.orderid = z.orderid ";
          squery = squery + " and tbl_suborderdetail.itemid = z.itemid ";
          squery = " UPDATE tbl_suborderdetail SET pendingqty = (qty - z.base_qty) " +
              " FROM (SELECT z.orderid, z1.itemid, sum(base_qty) base_qty from tbl_billingmaster z " +
              " INNER JOIN tbl_billingdetails z1 ON z.billingmasterid = z1.billingmasterid " +
              " INNER JOIN (Select orderid from tbl_billingmaster where billingmasterid = " + billingmasterid + " ) ord ON z.orderid =ord.orderid " +
              " WHERE COALESCE(z.orderid, 0) <> 0 AND z.orderid = ord.orderid  " +
              " GROUP BY z.orderid, z1.itemid) z " +
              " WHERE tbl_suborderdetail.orderid = z.orderid " +
              " AND tbl_suborderdetail.itemid = z.itemid ";
          await postgreConnection.query(squery);
        }
        dtresponse.push({
          RowId: mstdetails.rowid,
          billing_id: parseInt(billingmasterid),
          billing_no: mstdetails.vch_no,
          brandid: mstdetails.brandid,
        })
      }
      response = JSON.stringify(dtresponse);
    } catch (error) {
      IsError = true;
      response = null;
    }
    return response;
  }

  static async PostOrder(JsonObject,UserId){
    writeLog('Start Post Order API ');
    let requeststr = null;
    let orderid = 0;
    let orderidstr = '';
    let result = '';
    let WebOrderNo = '';
    let ApiOrderNo = '';
    let VendorId = 0;
    let BrandId = 0;
    let sQuery = '';

    try {
      requeststr = JSON.stringify(JsonObject);
      writeLog(requeststr);
      let requestParam = JSON.parse(requeststr);
      let objOrd = {};
      let dtresponse = [];

      for (const mstdetails of requestParam.OrderMasterList) {
        sQuery = `SELECT count(*) FROM tbl_ordermaster om INNER JOIN tbl_subordermaster som on om.orderid = som.orderid where apiorderno = '${mstdetails.apiorderno}' and som.partyid=${UserId} and om.brandid=${mstdetails.brandid}`;
        let ordercount = parseInt((await postgreConnection.query(sQuery))[0].count);
        console.log(ordercount,'....orderCount');

        sQuery = `SELECT om.orderid FROM tbl_ordermaster om INNER JOIN tbl_subordermaster som on om.orderid = som.orderid where apiorderno = '${mstdetails.apiorderno}' and som.partyid=${UserId}and om.brandid=${mstdetails.brandid}`;
        orderid = await postgreConnection.query(sQuery);
        // orderid = (await postgreConnection.query(sQuery))[0].orderid;
        console.log(orderid,'ordier');

        BrandId = mstdetails.brandid;

        sQuery = `SELECT apiorderno FROM tbl_ordermaster om INNER JOIN tbl_subordermaster som on om.orderid = som.orderid where apiorderno = '${mstdetails.apiorderno}' and som.partyid=${UserId}and om.brandid=${mstdetails.brandid}`;
        WebOrderNo = await postgreConnection.query(sQuery);
        // WebOrderNo = (await postgreConnection.query(sQuery))[0].apiorderno;

        if (ordercount === 0) {
          sQuery = `INSERT INTO tbl_ordermaster(apiorderno,orderdate,orderedby,synchedon,remark,brandid) VALUES('${mstdetails.apiorderno}','${new Date(mstdetails.orderdate).toISOString()}','${UserId}','${new Date(mstdetails.synchedon).toISOString()}','${mstdetails.remark}',${mstdetails.brandid})  returning orderid`;
          writeLog('Order Master Query ' + sQuery);

          orderid = (await postgreConnection.query(sQuery))[0].orderid;
          console.log(orderid,'...orderids');
          sQuery = `Update tbl_ordermaster set orderno='RE' || lpad(cast(orderid as text),10,'0') Where orderid=${orderid} returning orderno`;
          WebOrderNo = (await postgreConnection.query(sQuery))[0].orderno;

          objOrd.Web_OrderNo = WebOrderNo;
          objOrd.API_OrderNo = mstdetails.apiorderno;
          objOrd.OrderDate = mstdetails.orderdate;

          if (orderid > 0) {
            let SubOrderNo = '';
            for (const item of mstdetails.OrderItemList) {
              let suborderid = 0;
              VendorId = item.vendorid;
              BrandId = item.brandid;
              sQuery = `SELECT COALESCE(suborderid,0) as suborderid FROM tbl_subordermaster WHERE vendorid = ${item.vendorid} AND brandid = ${item.brandid} AND orderid = ${orderid}`;
              suborderid = await postgreConnection.query(sQuery);
              // suborderid = parseInt((await postgreConnection.query(sQuery))[0].suborderid);
              console.log(suborderid,'...suborderid');

              if (suborderid === 0) {
                sQuery = `INSERT INTO tbl_subordermaster(orderid,suborderno,suborderdate,vendorid,partyid,brandid,createdby,remark,longitude,latitude,devicetype) VALUES(${orderid},'${SubOrderNo}','${new Date(mstdetails.orderdate).toISOString()}','${item.vendorid}','${UserId}','${item.brandid}',${UserId},'${mstdetails.remark}',${parseFloat(mstdetails.longitude)},${parseFloat(mstdetails.latitude)},${mstdetails.Devicetype || null}) returning suborderid`;
                writeLog('Sub Order Master Save Query ' + sQuery);

                suborderid = (await postgreConnection.query(sQuery,'update'))[0].suborderid;

                SubOrderNo = (await postgreConnection.query(`Update tbl_subordermaster set suborderno='RE' || lpad(cast(suborderid as text),10,'0') Where suborderid=${suborderid} returning suborderno`,"update"))[0].suborderno;
              }

              objOrd.DivisionId = item.divisionid || null;

              let Rate = 0;
              if (item.amount > 0) {
                Rate = item.amount / item.orderqty;
              }

              // sQuery = `INSERT INTO tbl_suborderdetail(subordermasterid,orderid,brandid,itemid,qty,rate,amount,orderuomid,divisionid,createdby,pendingqty) VALUES(${suborderid},${orderid},${item.brandid},${item.itemid},${item.orderqty},${Rate},${item.amount},${item.orderuomid},${item.divisionid || null},${UserId},${item.orderqty}) returning suborderdetailid`;
              // writeLog('Sub Order Detail Save Query ' + sQuery);

              // let suborderdetailid = (await postgreConnection.query(sQuery,"insert"))[0].suborderdetailid;

              // sQuery = `UPDATE tbl_subordermaster SET grandtotal = (SELECT SUM(amount) FROM tbl_suborderdetail WHERE subordermasterid = ${suborderid} ) WHERE suborderid = ${suborderid}`
              // writeLog("Update grandtotal Query " + sQuery);
              // let updateorderid = await postgreConnection.query(sQuery,"update");
            }
          }
        }

        const alter_on = new Date().toISOString();
        dtresponse = {
          order_id: orderid,
          apiorderno: mstdetails.apiorderno,
          weborder_no: WebOrderNo,
          alter_on,
          rowid: mstdetails.rowid,
          brandid: BrandId,
        };

      }

      
      try {
        sQuery = `SELECT fcmid, appname FROM tbl_mobilesessiondetail WHERE userid='${VendorId}' ORDER BY id DESC LIMIT 1;`;
        let dtSendNotficn = await postgreConnection.query(sQuery);

        if (dtSendNotficn.length > 0) {
          sQuery = `SELECT brandname FROM tbl_brandmaster WHERE brandid  = '${BrandId}';`;
          let dtBrandName = await postgreConnection.query(sQuery);
          objOrd.BrandName = dtBrandName[0]['brandname'];
          objOrd.BrandId = BrandId;
          objOrd.OrderDate = objOrd.OrderDate ? new Date(objOrd.OrderDate).toISOString() : objOrd.OrderDate;

          sQuery = `SELECT tl.ledgername FROM tbl_userdesignationmapping tu INNER JOIN tbl_ledgermaster tl ON tu.dmsledgercode  = tl.ledgercode AND tu.brandid ='${objOrd.BrandId}' AND tl.brandid ='${objOrd.BrandId}'`;
          const dtUserName = await postgreConnection.query(sQuery + `and tu.userid = '${UserId}'`);
          console.log(dtUserName,'....dtUserName');
          // objOrd.UserName = dtUserName[0]['ledgername'];

          const dtCustName = await postgreConnection.query(sQuery + `and tu.userid = '${VendorId}'`);
          console.log(dtCustName,'...dtCustName');
          // objOrd.CustomerName = dtCustName[0]['ledgername'];

          sQuery = `SELECT td.divisionid, td.divisioncode, td.divisionname FROM tbl_divisionmaster td WHERE td.brandid ='${objOrd.BrandId}' AND td.divisionid ='${objOrd.DivisionId}'`;
          const dtdivisiondetail = await postgreConnection.query(sQuery);

          if (dtdivisiondetail != 0 && dtdivisiondetail.length > 0) {
            objOrd.DivisionId = dtdivisiondetail[0].divisionid;
            objOrd.DivisionCode = dtdivisiondetail[0].divisioncode;
            objOrd.DivisionName = dtdivisiondetail[0].divisionname;
          }

          sQuery = `SELECT notification_body, notification_subject FROM tbl_notification_data WHERE  notification_type ='DealerCreateOrder' AND brandid  = '${objOrd.BrandId}';`;
          const dtNotification = await postgreConnection.query(sQuery);
          console.log(dtNotification,'...dtNotification');

          if(dtNotification.length === 0){
            sQuery = `select notification_body,notification_subject from tbl_notification_data where  notification_type ='DealerCreateOrder' and brandid='0'`;
            dtNotification = await postgreConnection.query(sQuery)
          }

          objOrd.Notification_Body = dtNotification[0]['notification_body']
          objOrd.Notification_Body = objOrd.Notification_Body.replace("{#distributorname#}", objOrd.CustomerName)
            .replace("{#dealername#}", objOrd.UserName)
            .replace("{#APIOrderNo#}", objOrd.API_OrderNo)
            .replace("{#OrderDate#}", objOrd.OrderDate)
            .replace("{#BrandName#}", objOrd.BrandName)
            .replace("{#BrandId#}", objOrd.BrandId)
            .replace("{#DivisionName#}", objOrd.DivisionName);

          objOrd.Notification_Subject = dtNotification[0].notification_subject;

          writeLog(`Notification PlaceOrderCancel ${dtSendNotficn[0].fcmid} ${objOrd.Notification_Body}`);
          // objOrd.Notification_Subject = objOrd.Notification_Subject.replace("{#CustomerName#}", objOrd.CustomerName).replace("{#username#} ", objOrd.UserName);
          const AppName = dtSendNotficn[0].appname;
          const json = JSON.stringify(objOrd);
          const fcmObj = {
            to: dtSendNotficn[0].fcmid,
            data: { message: json, type: objOrd.Notification_Subject },
          };
          console.log(fcmObj,'...fcmObj');
          // await OrderService.SendRequestGoogleApi(fcmObj, BrandId, AppName);
          writeLog(JSON.stringify(fcmObj));
        }
      } catch (ex) {

      }

      result = JSON.stringify(dtresponse);

    } catch (ex) {
      // await postgreConnection.query('ROLLBACK');
      requeststr = null;
      throw ex;
      writeLog('Start Post Order API catch error ' + ex.message);
    }

    return result;
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
    let url = '';
    let apiResponse = '';
    let data = null;
    try {
        url = 'https://fcm.googleapis.com/fcm/send';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let key = '';
        writeLog("SendRequestGoogleApi " + L_brandid.toString());
        if (appname.includes('Pragati Path')) {
            key = 'AAAAXdkdE6E:APA91bHIoq0_TJANy0H0Y0f1RC15VoBaOsLtyNoEWrB2shNhzPveK3VnoLBp0nM0yaHBgaegDVhw1ctPZsp_s6my6T-IuwyCAy5GRDyTu4y50nqpQSQ4lc7Oc7ZJCyjYYJr4GdsvLv6Z';
        } else {
            key = 'AAAAk9p1Hog:APA91bEJig2kQmbnKPUx9DIZP5zkEd4LX4_bLa29F3uiiU1xD79rAlqr8t8sHob_vTtE6NmFCbffTnxFrn0fgh1Nb04HCBLxY1yQTx2FGRbc1XdYnEY-lt7BQQqHMEZ4PKW7IXCWdOR5';
        }

        options.headers.Authorization = `key=${key}`;

        const params = JSON.stringify(obj);
        options.headers['Content-Length'] = Buffer.byteLength(params);

        let ax = await axios({
          method: method,
          url: url,
          data: data,
        });
        console.log(ax.data,'axData');
        result = ax.data;

        // const request = https.request(url, options, response => {
        //     let data = '';
        //     response.on('data', chunk => {
        //         data += chunk;
        //     });
        //     response.on('end', () => {
        //         apiResponse = data;
        //         const objRes = JSON.parse(apiResponse);
        //         if (objRes.success) {
        //             result = true;
        //         } else {
        //             result = false;
        //         }
        //     });
        // });

        // request.on('error', error => {
        //     console.error('Error in sending request:', error);
        //     result = false;
        // });

        // request.write(params);
        // request.end();

    } catch (error) {
        console.error('Exception in sending request:', error);
        result = false;
    }
    return result;
  }
};
