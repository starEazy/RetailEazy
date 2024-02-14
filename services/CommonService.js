'use strict'

const postgreConnection = require('../apps/helpers/sequelizeHelper')
const { writeLog, DbNull, IsNull } = require('../apps/helpers/utils')

class CommonService {
  static async Sync_ManualErrorLogs(JsonObject) {
    writeLog(`Sync_ManualErrorLogs Json  ${JsonObject}`)
    let response = ''
    let squery = ''

    let dtresponse = []
    let errorid = null
    try {
      const requeststr = JSON.stringify(JsonObject)
      if (!requeststr) return null

      const mstdetails = JSON.parse(requeststr)

      squery = `INSERT INTO tbl_manual_error_log_sync(user_id, user_mobile, emailid, brand_id, orderjson, billingjson, purchasejson, dealerjson, availablejson, ischecked, devicetype, divisionid)
            VALUES (${mstdetails.user_id}, '${mstdetails.user_mobile}', '${
        mstdetails.emailid
      }', ${parseInt(mstdetails.brand_id)}, 
            '${mstdetails.orderjson}', '${mstdetails.billingjson}', '${
        mstdetails.purchasejson
      }', '${mstdetails.dealerjson}', 
            '${mstdetails.availablejson}', false, ${IsNull(
        mstdetails.Devicetype,
        'Integer',
      )}, ${IsNull(mstdetails.divisionid, 'Integer')})
            RETURNING errorid`

      writeLog(`Sync_ManualErrorLogs Save Query ${squery}`)

      errorid = postgreConnection.query(squery, 'insert')
      dtresponse.push({ errorid })
      response = dtresponse
      return response
    } catch (ex) {
      return ex
    }
  }

  static async Sync_AppAutomaticErrorLog(JsonObject) {
    writeLog(`Sync_AppAutomaticErrorLog Json  + ${JsonObject}`)
    let response = ''
    let squery = ''

    let dtresponse = []
    let errorid = null
    try {
      const requeststr = JSON.stringify(JsonObject)
      if (!requeststr) return null

      const mstdetails = JSON.parse(requeststr)

      squery = `INSERT INTO tbl_automatic_error_log_sync(user_id, user_mobile, emailid, brand_id, billingjson, ischecked, purchasejson, devicetype, divisionid)
            VALUES (${mstdetails.user_id}, '${mstdetails.user_mobile}', '${
        mstdetails.emailid
      }', ${parseInt(mstdetails.brand_id)}, 
            '${mstdetails.billingjson}', false, '${
        mstdetails.purchasejson
      }', ${IsNull(mstdetails.Devicetype, 'Integer')}, ${IsNull(
        mstdetails.divisionid,
        'Integer',
      )})
            RETURNING errorautoid`

      writeLog(`Sync_AppAutomaticErrorLog Save Query  + ${squery}`)

      errorid = postgreConnection.query(squery, 'insert')
      dtresponse.push({ errorid })
      response = dtresponse
      return response
    } catch (ex) {
      return ex
    }
  }

  static async Sync_UserApiLogDetail(JsonObject) {
    writeLog('Sync_UserApiLogDetail Json ' + JsonObject)
    let response = ''
    let squery = ''

    let dtresponse = []
    let userapilogid = null
    try {
      const requeststr = JSON.stringify(JsonObject)
      if (!requeststr) return null

      const mstdetails = JSON.parse(requeststr)

      squery = `INSERT INTO tbl_app_login_data_sync_logs(user_id, user_mobile, emailid, api_log_details, api_log_type, app_name, devicetype)
            VALUES (${mstdetails.user_id}, '${mstdetails.user_mobile}', '${
        mstdetails.emailid
      }', '${mstdetails.api_log_details}', '${mstdetails.api_log_type}', '${
        mstdetails.app_name
      }', ${IsNull(mstdetails.Devicetype, 'Integer')})
            RETURNING userapilogid`

      writeLog('Sync_UserApiLogDetail Save Query ' + squery)

      userapilogid = postgreConnection.query(squery, 'insert')
      dtresponse.push({ userapilogid })
      response = dtresponse
      return response
    } catch (ex) {
      return ex
    }
  }

  static async Chart(json, token) {
    let lstDashBoard = []
    try {
      let objDashBoard = null
      let Objquery = null
      let objChart = null
      let dt = await CommonService.GetQuery(
        json.TransactionType ? json.TransactionType : 'Sales',
      )

      if (dt && dt.length > 0) {
        for (let row of dt) {
          let sQuery = `
                    Select qryid, query, queryfor, charttype, isdisplaycountwithlabel, headers, yaxislabel, backcolor, fontcolor, viewmode
                    from dashboardqueries
                    where qryid = ${DbNull(row['qryid'], 'Integer32')}
                `

          let dtFilter = await postgreConnection.query(sQuery)

          Objquery = CommonService.BindDataToModel(
            dtFilter,
            DbNull(json.fromDate, 'Text'),
            DbNull(json.todate, 'Text'),
          )

          if (Objquery.charttype.toLowerCase() === 'widgtbox') {
            let objWidget = CommonService.GetWidget(Objquery, token.Employeeid)
            if (objWidget) {
              objDashBoard.WidgetBox.push(objWidget)
              objDashBoard.Type = Objquery.viewmode
              lstDashBoard.push(objDashBoard)
            }
          } else {
            let objSeries = await CommonService.GetChartList(
              Objquery,
              token.user_id,
            )
            if (objSeries) {
              objChart = new Charts()
              objChart.Series.push(objSeries)
              objDashBoard.Chart = objChart
              objDashBoard.Type = Objquery.viewmode
              objDashBoard.Chart.ChartType = Objquery.charttype
              objDashBoard.Chart.ChartLable = Objquery.queryfor
              objDashBoard.Chart.XAxisLabel = 'NA'
              objDashBoard.Chart.YAxisLabel = Objquery.yaxislabel
              lstDashBoard.push(objDashBoard)
            }
          }
        }
      }
      return lstDashBoard
    } catch (ex) {
      throw ex
    }
  }

  static async GetChartList(querywithFilter, userid) {
    let objSeries = null
    try {
      // Replace placeholders in the query string with actual values
      querywithFilter.query = querywithFilter.query
        .replace('@@userid', userid)
        .replace('@@startdate', `'${querywithFilter.fromDate}'`)
        .replace('@@enddate', `'${querywithFilter.todate}'`)
        .replace(/\r\n/g, ' ')
        .replace(/\t/g, ' ')

      // Execute the query and get the chart data
      const dtChart = postgreConnection.query(querywithFilter.query) // Replace executeQuery with your database query execution function

      // Process the chart data based on the chart type
      if (dtChart && dtChart.length > 0) {
        objSeries = new Series()
        if (
          querywithFilter.charttype === 'Doughnut' ||
          querywithFilter.charttype === 'Pie'
        ) {
          objSeries.name = querywithFilter.queryfor
          for (let i = 0; i < dtChart.length; i++) {
            objSeries.Points.push({
              X: DbNull(dtChart[i][0], 'Text'),
              Y: DbNull(dtChart[i][dtChart.columns.length - 1], 'Text'),
              text: DbNull(dtChart[i][0], 'Text'),
            })
          }
        } else if (
          querywithFilter.charttype === 'Column' ||
          querywithFilter.charttype === 'Line'
        ) {
          for (let i = 1; i < dtChart.columns.length - 1; i++) {
            for (let rows = 0; rows < dtChart.length; rows++) {
              objSeries.Points.push({
                X: DbNull(dtChart[rows][0], 'Text'),
                Y: DbNull(dtChart[rows][i], 'Text'),
              })
            }
            objSeries.name = dtChart.columns[i].ColumnName
          }
        }
      }
    } catch (ex) {
      objSeries = null
      throw ex
    }
    return objSeries
  }

  static async GetWidget(querywithFilter, EmployeeId) {
    let ObjWidgetBox = null
    try {
      querywithFilter.query = querywithFilter.query
        .replace(/@@distributorempid@@/g, `${EmployeeId}`)
        .replace(/\r\n|\t/g, ' ')

      let dtWidgtBOx = await postgreConnection.query(
        // Not sure for type of query
        querywithFilter.query,
      )
      if (dtWidgtBOx && dtWidgtBOx.length > 0) {
        ObjWidgetBox = {}
        if (querywithFilter.charttype.toLowerCase() === 'widgtbox') {
          ObjWidgetBox.WidgetCounting = DbNull(dtWidgtBOx[0][0], 'Text')
          ObjWidgetBox.WidgetName = DbNull(querywithFilter.queryfor, 'Text')
          ObjWidgetBox.BackColor = querywithFilter.backColor
          ObjWidgetBox.FontColor = querywithFilter.fontColor
        }
      }
      return ObjWidgetBox
    } catch (ex) {
      ObjWidgetBox = null
      writeLog(`${ex}`, `error`)
      return null
    }
  }

  static async GetQuery(transType) {
    try {
      let sQuery =
        'Select qryid,query,queryfor,charttype,isdisplaycountwithlabel,headers from dashboardqueries ' +
        "where (viewmode='Chart' or viewmode='WidgtBox') and trantype='" +
        transType +
        "'  " +
        'and isshown=true order by qryid;'
      let dt = await postgreConnection.query(sQuery)
      return dt
    } catch (ex) {
      throw ex
    }
  }

  static async BindDataToModel(dtQuery, FromDate, ToDate) {
    let Objquery = {}
    try {
      Objquery.qryid = DbNull(dtQuery[0]['qryid'], 'Integer32')
      Objquery.query = DbNull(dtQuery[0]['query'], 'Text')
      Objquery.queryfor = DbNull(dtQuery[0]['queryfor'], 'Text')
      Objquery.charttype = DbNull(dtQuery[0]['charttype'], 'Text')
      Objquery.isdisplaycountwithlabel =
        DbNull(dtQuery[0]['isdisplaycountwithlabel'], 'Text') === 'False'
          ? false
          : true
      Objquery.headers = DbNull(dtQuery[0]['headers'], 'Text')
      Objquery.yaxislabel = DbNull(dtQuery[0]['yaxislabel'], 'Text')
      Objquery.backColor = DbNull(dtQuery[0]['backcolor'], 'Text')
      Objquery.fontColor = DbNull(dtQuery[0]['fontcolor'], 'Text')
      Objquery.viewmode = DbNull(dtQuery[0]['viewmode'], 'Text')
      Objquery.fromDate = FromDate
        ? new Date(FromDate)
        : new Date().setDate(new Date().getDate() - 7) //
      Objquery.todate = ToDate ? new Date(ToDate) : new Date()
      return Objquery
    } catch (ex) {
      throw ex
    }
  }
}

module.exports = CommonService
