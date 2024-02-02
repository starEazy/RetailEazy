"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");

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
};
