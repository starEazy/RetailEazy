'use strict'

const postgreConnection = require('../apps/helpers/sequelizeHelper')
const { writeLog } = require('../apps/helpers/utils')

class LoyaltyService {
  static async Loyalty_MasterData(objval, masterName, user_id) {
    try {
      writeLog(
        `---Alter On AND PageIndex---${objval.alteredon}${
          objval.pageindexno
        }---Start Time--${new Date().toISOString()}`,
      )

      const sQuery = `
                SELECT * FROM loyalty_getmaster(
                    '${objval.alteredon}',
                    ${user_id},
                    '${masterName}',
                    ${objval.pageindexno},
                    '${objval.processtype}'
                )`

      writeLog(`---Get Master Data Query---${sQuery}`)

      const result = await postgreConnection.query(sQuery)

      console.log('>>>>>>>>>result', result)
      if (result.length > 0) {
        writeLog(
          `Return Api AlterOn Is ${
            objval.alteredon
          } --End Time Is-- ${new Date()} --Return No Of Count--- ${
            result.length
          }`,
        )
        return result[0]
      } else {
        writeLog('---Data Not Found---')
        return ''
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async Get_transaction_voucher_Json(objparm, masterName, user_id) {
    try {
      writeLog('Start Get transaction/voucher API ')
      let result = ''

      const alteredon = objparm.alteredon.slice(0, 19).replace('T', ' ')

      let sQuery = ''

      if (masterName === 'LOYALTYTRANSACTION' || masterName === 'GIFTVOUCHER') {
        sQuery = `SELECT * FROM get_loyalty_transactiondetail('${alteredon}', ${user_id}, '${masterName}', ${objparm.pageindexno})`
      }

      writeLog(`Get transaction/voucher Execute Function ${sQuery}`)
      const queryResult = await postgreConnection.query(sQuery)
      result = queryResult[0]
      return result
    } catch (error) {
      throw error
    }
  }

  static async Loyalty_Transactiondatapost(objval, user_id) {
    const transactionids = []
    const modelobjreturn = { TransactionMasterListReturn: [] }

    // const tran = await client.query("BEGIN");

    try {
      writeLog(
        `---Alter On AND PageIndex---${objval.TransactionMasterList.toString()}---Start Time--${new Date().toISOString()}`,
      )

      for (const transmaster of objval.TransactionMasterList) {
        const masterobjreturn = { TransactiondetailListReturn: [] }

        let sQuery = `
                INSERT INTO loyalty_transaction_master(userid, userloggedinbrandid, totalredeemedpoints, deliveryid, deliveryremarks, redemptiontypeid, totalpurchasedqty, isactive, createdon, createdby)
                VALUES(${user_id}, ${
          transmaster.userloggedinbrandid
        }, ${Configure.IsNull(
          transmaster.totalredeemedpoints,
          VarType.Integer,
        )}, ${transmaster.deliveryid}, '${transmaster.deliveryremarks}',
                ${transmaster.redemptiontypeid}, ${Configure.IsNull(
          transmaster.totalpurchasedqty,
          VarType.Dec,
        )}, ${Configure.IsNull(
          transmaster.isactive,
          VarType.Bool,
        )}, NOW(), ${user_id}) RETURNING transactionid
            `
        writeLog(`Transaction Master Query ${sQuery}`)

        const transactionResult = await postgreConnection.query(
          sQuery,
          'insert',
        )
        transmaster.transactionid = transactionResult[0].transactionid
        masterobjreturn.transactionid = transmaster.transactionid
        masterobjreturn.userloggedinbrandid = transmaster.userloggedinbrandid
        masterobjreturn.userid = user_id
        masterobjreturn.rowid = transmaster.rowid
        masterobjreturn.alteredon = new Date().toISOString()

        transactionids.push(transmaster.transactionid)

        if (transmaster.transactionid > 0) {
          for (const transdetail of transmaster.TransactiondetailList) {
            const detailsobj = {}

            sQuery = `
                        INSERT INTO loyalty_transaction_detail(transactionid, catalogueid, cataloguecode, cataloguemrp, brandcatalogueid, redumptionpointperqty, mrp, deliverydays, deliverycharges, expirydate, vendorid, brandid, quantity, totalredeemedpoints, totalredeemedamount)
                        VALUES(${transmaster.transactionid}, ${
              transdetail.catalogueid
            }, '${Configure.IsNull(
              transdetail.cataloguecode,
              VarType.Text,
            )}', ${Configure.IsNull(transdetail.cataloguemrp, VarType.Dec)}, ${
              transdetail.brandcatalogueid
            },
                        ${Configure.IsNull(
                          transdetail.redumptionpointperqty,
                          VarType.Dec,
                        )}, ${Configure.IsNull(
              transdetail.mrp,
              VarType.Dec,
            )}, ${Configure.IsNull(
              transdetail.deliverydays,
              VarType.Dec,
            )}, ${Configure.IsNull(transdetail.deliverycharges, VarType.Dec)},
                        '${new Date(
                          transdetail.expirydate,
                        ).toISOString()}', ${Configure.IsNull(
              transdetail.vendorid,
              VarType.Integer32,
            )}, ${Configure.IsNull(
              transdetail.brandid,
              VarType.Integer32,
            )}, ${Configure.IsNull(transdetail.quantity, VarType.Dec)},
                        ${Configure.IsNull(
                          transdetail.totalredeemedpoints,
                          VarType.Integer32,
                        )}, ${Configure.IsNull(
              transdetail.totalredeemedamount,
              VarType.Dec,
            )}) RETURNING transactiondetailid
                    `
            writeLog(`Transaction Details Query ${sQuery}`)

            const detailResult = await postgreConnection.query(sQuery, 'insert')
            transdetail.transactiondetailid =
              detailResult[0].transactiondetailid
            detailsobj.transactiondetailid = transdetail.transactiondetailid
            detailsobj.catalogueid = transdetail.catalogueid
            detailsobj.transactionid = masterobjreturn.transactionid
            detailsobj.rowid = transdetail.rowid
            masterobjreturn.TransactiondetailListReturn.push(detailsobj)
          }
        }

        modelobjreturn.TransactionMasterListReturn.push(masterobjreturn)
      }

      // await client.query("COMMIT");

      LoyaltyMoveToDMS(transactionids)
    } catch (error) {
      // await client.query("ROLLBACK");
      throw error
    }

    return modelobjreturn
  }

  static async loyaltyMoveToDMS(transactionids) {
    try {
      writeLog(`Start Loyalty Move to DMS ${transactionids}`)

      if (transactionids.trim().length > 1) {
        transactionids = transactionids.substring(0, transactionids.length - 1)
      }

      if (transactionids.trim() !== '') {
        const brandQuery = `SELECT distinct userloggedinbrandid brandid FROM loyalty_transaction_master WHERE transactionid in (${transactionids});`
        writeLog(`Select Brand ID Based on Loyalty ${brandQuery}`)

        const brandResponse = await postgreConnection.query(brandQuery)
        const brandData = brandResponse.data

        for (let i = 0; i < brandData.length; i++) {
          const brandId = brandData[i].brandid

          const brandUrlQuery = `SELECT brand_url FROM tbl_brandmaster WHERE brandid = ${brandId}`
          writeLog(`Brand URL Based on Brand Id ${brandUrlQuery}`)

          const brandUrlResponse = await postgreConnection.query(brandUrlQuery)
          const brandUrl = brandUrlResponse.data[0].brand_url

          const brandCodeQuery = `SELECT brandcode FROM tbl_brandmaster WHERE brandid = ${brandId}`
          const brandCode = await postgreConnection.query(brandCodeQuery)

          if (!brandCode.toLowerCase().includes('prince')) {
            return false
          }

          const myData = {
            brandid: brandId,
            transactionid: transactionids,
          }
          const jsonData = JSON.stringify(myData)

          const itemQuery = `SELECT * FROM fun_dmsloyalti('GetLoyaltyPushToDMS','${jsonData}','${generateGuid()}')`
          writeLog(`DMS Loyalti Query ${itemQuery}`)

          const pushJsonResponse = await postgreConnection.query(itemQuery)
          const pushJson = pushJsonResponse

          writeLog(`DMS Loyalti Query Result ${pushJson}`)

          async function coomURLDMSHttpPostJson(
            url,
            endpoint,
            method,
            data,
            token,
          ) {
            // Simulate HTTP post request to DMS
            // Replace this with your actual HTTP request logic
            const response = await axios.post(`${url}/${endpoint}`, data, {
              headers: { Authorization: `Bearer ${token}` },
            })
            return response.data
          }

          const dmsLoyaltyStatus = await coomURLDMSHttpPostJson(
            brandUrl,
            'api/Create_SalesOrder_Princepipe',
            'POST',
            pushJson,
            Token,
          )
          writeLog(`DMS Loyalti 1.1 Response ${dmsLoyaltyStatus}`)

          const respResult = JSON.parse(dmsLoyaltyStatus)

          if (respResult.status.toLowerCase() === 'error') {
            const updateErrorQuery = `UPDATE loyalty_transaction_master SET sapremarks='${respResult.Message}', alteredon = CURRENT_TIMESTAMP WHERE transactionid in (${transactionids})`
            await postgreConnection.query(updateErrorQuery, 'udpate')
          } else if (respResult.status.toLowerCase() === 'success') {
            const updateSuccessQuery = `UPDATE loyalty_transaction_master SET sapremarks='${respResult.Message}', alteredon = CURRENT_TIMESTAMP, sapmasterid='${respResult.MasterId}', isdmssync=true WHERE transactionid in (${transactionids})`
            await postgreConnection.query(updateSuccessQuery, 'udpate')
          }

          // Add delay to avoid rate limiting or any other issues
          await sleep(1000)
        }
      }
    } catch (error) {
      writeLog(`DMS Loyalti Push 1.5 Error ${error.message}`, 'error')
      return false
    }
    return true
  }
}

module.exports = LoyaltyService
