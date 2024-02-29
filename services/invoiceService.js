"use strict";
const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { writeLog } = require("../apps/helpers/utils");

module.exports = class InvoiceService {
  static async GetOrderJson(objparm, Userid, masterName) {
    writeLog("Start Get Order/Billing API ");
    let sQuery = `SELECT * FROM getbillingdetail('${objparm.alteredon}',${Userid},'${masterName}','${objparm.pageindexno}')`;
    writeLog(`Get Order/Billing Execute Function ${sQuery}`);
    let result = await postgreConnection.query(sQuery);
    return result;
  }
  static async saveInvoiceDetails(saveinvoicelist, attachment, IsError) {
    let squery = "";
    let invoiceid = 0;
    let invoicedetailid = 0;
    let userid = 0;
    let IsCount = 0;
    IsError = false;
    let returndata = "";
    let invoiceids = "";
    let partybilldate = "";
    let t_trantype = "";
    let dtresponse = [];
    // tran = postgreConnection.Conn.BeginTransaction();
    try {
      for(const entity of saveinvoicelist.PurchaseMasterList){
        squery = `Select logintypeid  from tbl_userdesignationmapping where  userid=${entity.customerid} limit 1`;
        let logintype = parserInt(await postgreConnection.query(squery));

        if (logintype == 6) {
          squery = `select userid from tbl_userdesignationmapping Where brandid=${entity.brandid} and designationid in (3,4) and dmsledgercode='${entity.distributorcode}' limit 1 `;
          entity.distributor_id = parserInt(await postgreConnection.query(squery));
        }

        squery = `select COALESCE(userid,0) from tbl_userdesignationmapping Where isactive = true AND brandid=${entity.brandid} and userid='${entity.distributor_id}'`;
        let ds_ledgerid = parserInt(postgreConnection.query(squery));
        if (parserInt(ds_ledgerid) == 0) {
          // tran.Rollback();
          IsError = true;
          writeLog(entity.apporderno + " Distributor not exits");
          return "Distributor not exits";
        }
        if (parserInt(entity.customerid) == 0) {
          // tran.Rollback();
          IsError = true;
          writeLog(entity.apporderno + " Empty Dealer/Customer request");
          return "Empty Dealer/Customer request.";
        }
        if (parserInt(entity.customerid) != tokenDetails.UserId) {
          // tran.Rollback();
          IsError = true;
          writeLog(entity.apporderno + " The customer does not exist in our records.");
          return "The customer does not exist in our records.";
        }

        if (entity.party_bill_date != "") {
          // partybilldate = Convert.ToDateTime(entity.party_bill_date).ToString("yyyy-MM-dd");
          partybilldate = new Date(entity.party_bill_date).toISOString().split('T')[0];
        }

        t_trantype = "purchase invoice"; // dealer/retailer
        squery = `Select COALESCE(ledgertype,0) from tbl_ledgermaster where registrationid =${entity.customerid}`;
        let ledgertype = parserInt(postgreConnection.query(squery));
        if (ledgertype == 1)
        {
          t_trantype = "Primary PI"; //distributor
        }

        squery = "Select count(1),max(billingmasterid) billingmasterid " +
                " from tbl_billingmaster WHERE brandid=" + entity.brandid + " And customerid =" + entity.customerid + "  " +
                " and vch_no='" + entity.apporderno + "' and vch_date='" + entity.orderdate + "' and lower(tran_type)=lower('" + t_trantype + "') " +
                " AND createdtype=2 ";
        writeLog("PI Validation Query " + squery);
        let IsCountStatus = postgreConnection.query(squery);

        if (IsCountStatus.length > 0)
        {
          if (parserInt(IsCountStatus[0]["count"]) == 1) {
            dtresponse.push({
              RowId: entity.rowid,
              billing_id: parserInt(IsCountStatus[0]["billingmasterid"]),
              billing_no: entity.apporderno,
              alteredon: System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
              PIAttachment: "",
              brandid: entity.brandid
            })
            returndata = JSON.stringify(dtresponse);
            return returndata;
          }
          else if (parserInt(IsCountStatus[0]["count"]) > 1) {
            IsError = true;
            return "Entry No already exits";
          }
        }
        
        squery = `SELECT lm.ledgerid from tbl_registration rm INNER JOIN tbl_ledgermaster lm on rm.registrationid = lm.registrationid where rm.registrationid =${entity.distributor_id} `;
        let db_dsid = parserInt(postgreConnection.query(squery));
        db_dsid = entity.distributor_id; 

        entity.party_bill_no = entity.party_bill_no.replace(/'/g, " ");
        squery = "INSERT INTO tbl_billingmaster(sellerid,customerid,brandid,vch_no,vch_date,tran_type,createdby,nettotal,orderid,remark,partybillno,partybilldate,createdtype,devicetype,totaltax,latitude,longitude ) VALUES ";
        squery += "(" + entity.distributor_id + "," + entity.customerid + "," + entity.brandid + ",'" + entity.apporderno + "', ";
        squery += " '" + Convert.ToDateTime(entity.orderdate).ToString("yyyy-MM-dd") + "','" + t_trantype + "'," + tokenDetails.UserId + ", ";
        squery += "" + entity.nettotal + "," + parserInt(entity.orderid) + ",'" + entity.remarks + "','" + Configure.IsNull(entity.party_bill_no, VarType.Text) + "',";
        
        
        squery += " " + (string.IsNullOrEmpty(entity.party_bill_date) ? "null" : " '" + partybilldate + "' ") + ",2," + entity.Devicetype + "," + Configure.IsNull(entity.total_tax, VarType.Dec) + "," + Configure.IsNull(entity.latitude, VarType.Dec) + "," + Configure.IsNull(entity.longitude, VarType.Dec) + ")  returning billingmasterid";

        writeLog("PI Master Save Query " + squery);

        invoiceid = parserInt(postgreConnection.query(squery));
        let alter_on = new Date().toISOString().split('T')[0] + ' ' + new Date().toISOString().split('T')[1].split('.')[0]; // "yyyy-MM-dd HH:mm:ss"
        let invoiceids = invoiceid + "," + invoiceids;

        for(const itemdetails of entity.PurchaseItemList) {
          let BaseUnit = 0; let AltUnit = 0;
          let BaseQty = 0; let AltQty = 0;
          let Conversion = 0; let Denominator = 0;
          let israteonaltunit = false;

          squery = `select COALESCE(itemid,0) from tbl_itemmaster Where brandid=${entity.brandid} and itemcode='${itemdetails.itemcode}`;
          let db_itemid = parserInt(await postgreConnection.query(squery));

          squery = "SELECT im.itemcode, COALESCE(im.baseunitid,0) AS baseunitid, COALESCE(im.altunitid,0) AS altunitid, "
                  + " COALESCE(im.conversion,0) AS conversion  ,COALESCE(im.denominator,0) AS denominator, "
                  + " COALESCE(bum.uomid,0) as u_baseunitid,COALESCE(aum.uomid,0) as u_altunitid "
                  + " FROM tbl_itemmaster im "
                  + " LEFT JOIN tbl_unitmaster  bum ON im.baseunitid = bum.uomid AND im.brandid = bum.brandid "
                  + " LEFT JOIN tbl_unitmaster  aum ON im.altunitid = aum.uomid AND im.brandid = aum.brandid "
                  + " WHERE im.brandid=" + entity.brandid + " and im.itemid=" + db_itemid + " ";
          let dtatt = await postgreConnection.query(squery);

          if (dtatt.length > 0)
          {
              itemdetails.itemid = db_itemid;
              if (parserInt(dtatt[0]["baseunitid"]) != parserInt(dtatt[0]["u_baseunitid"]))
              {
                // tran.Rollback();
                IsError = true;
                writeLog("Item [" + dtatt[0]["itemcode"] + "] base unit not exits");
                return "Item [" + dtatt[0]["itemcode"] + "] unit not exits";
              }
              if (parserInt(dtatt[0]["altunitid"]) != parserInt(dtatt[0]["u_altunitid"]))
              {
                // tran.Rollback();
                IsError = true;
                writeLog("Item [" + dtatt[0]["itemcode"] + "] alt unit not exits");
                return "Item [" + dtatt[0]["itemcode"] + "] unit not exits";
              }
              BaseUnit = parserInt(dtatt[0]["baseunitid"]);
              AltUnit = parserInt(dtatt[0]["altunitid"]);
              Conversion = parseFloat(dtatt[0]["conversion"]);
              Denominator = parseFloat(dtatt[0]["denominator"]);
              writeLog("BaseUnit- " + BaseUnit + " : AltUnit- " + AltUnit + " : Conversion- " + Conversion + " : Denominator- " + Denominator);
          }
          else
          {
              // tran.Rollback();
              writeLog("Item does not exist in our records.");
              IsError = true;
              return "Item does not exist in our records.";
          }
          BaseQty = parseFloat(itemdetails.orderqty);
          AltQty = Math.Round((Denominator / Conversion) * parseFloat(itemdetails.orderqty), 5);

          if (parserInt(itemdetails.orderumoid) == BaseUnit)
          {
            BaseQty = parseFloat(itemdetails.orderqty);
            AltQty = Math.Round((Denominator / Conversion) * parseFloat(itemdetails.orderqty), 5);
          }
          if (parserInt(itemdetails.orderumoid) == AltUnit)
          {
            BaseQty = Math.Round((Denominator * Conversion) * parseFloat(itemdetails.orderqty), 5);
            BaseQty = Math.Round((parseFloat(itemdetails.orderqty) * Conversion) / Denominator, 5);
            AltQty = parseFloat(itemdetails.orderqty);
            israteonaltunit = true;
          }

          squery = "INSERT INTO tbl_billingdetails(billingmasterid,itemid,divisionid,base_qty,alt_qty,rate,amount,unitid,israteonaltunit,grossamount,discountper,discountamount,gstassessablevalue,igstrate,cgstrate,sgstrate,igstamount,cgstamount,sgstamount,isdiscountaftertax,isinclusive,itemmrp,dmssodetailid) ";
          squery += " VALUES (" + invoiceid + "," + itemdetails.itemid + "," + Configure.IsNull(itemdetails.divisionid, VarType.Integer) + "," + BaseQty + "," + AltQty + "," + itemdetails.rate + "," + itemdetails.amount + "," + itemdetails.orderumoid + "," + israteonaltunit + "," + Configure.IsNull(itemdetails.grossamount, VarType.Dec) + "," + itemdetails.discountper + "," + itemdetails.discountamount + "," + itemdetails.gstassessablevalue + "," + itemdetails.igstrate + "," + itemdetails.cgstrate + "," + itemdetails.sgstrate + "," + itemdetails.igstamount + "," + itemdetails.cgstamount + "," + itemdetails.sgstamount + "," + Configure.IsNull(itemdetails.isdiscountaftertax, VarType.Bool) + "," + Configure.IsNull(itemdetails.isinclusive, VarType.Bool) + "," + Configure.IsNull(itemdetails.item_mrp, VarType.Dec) + "," + Configure.IsNull(itemdetails.dmssodetailid, VarType.Integer) + ")  returning billingdetailid";
          writeLog("PI Item Details Save Query " + squery);

          invoicedetailid = parserInt(postgreConnection.query(squery));

          for (const scan of itemdetails.ScanDetail) {
            if (scan.scantype === "voucher" && scan.itemcode !== itemdetails.itemcode) {
              IsError = true;
              return "Item Details and Scan Detail Items not matched.";
            }
        
            squery = `INSERT INTO tbl_billingitemserial(billingmasterid, billingdetailid, serial_id, batchcode, scancode, 
                scantype, iscarton, barcodetype, pairuid) VALUES 
                (${invoiceid}, ${invoicedetailid}, '${scan.serial_id}', '${scan.batchcode}', '${scan.scancode}', 
                '${scan.scantype}', ${Boolean(scan.iscarton)}, '${scan.barcodetype}', '${scan.pairuid}')  
                returning serialid`;
        
            writeLog("Purchase Invoice Scan Details Save Query " + squery);
            const serialid = parseInt(await postgreConnection.query(squery));
          }
        }

        let O_filename = "";
        for(const att of saveinvoicelist.PIAttachment) {
          let path = att.fileaddress;
          const file_name = `${invoiceid}_${att.filename}`;
          path += `${entity.brandid}/`;

          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
      
          path += file_name;
      
          const memStream = Buffer.from(att.Content);
          fs.writeFileSync(path, memStream);
      
          att.filename = file_name;
          att.fileaddress = path;
          O_filename = path;

          let squery = `INSERT INTO tbl_billingmaster_img(id, filename, fileextension, devicetype) 
            VALUES (${invoiceid}, '${att.filename}', '${att.fileaddress}', ${att.Devicetype})  
            returning docid`;
            
          const docid = parseInt(await postgreConnection.query(squery));
        }
        dtresponse.push({
          RowId: entity.rowid,
          billing_id: invoiceid,
          billing_no: entity.apporderno,
          alteredon: alter_on,
          PIAttachment: O_filename,
          brandid: entity.brandid
        })
      }
      returndata = JSON.stringify(dtresponse);
    } catch (error) {
      IsError = true;
      return error.message.toString();
    }
    return returndata;
  }
}

// module.exports = InvoiceService;
