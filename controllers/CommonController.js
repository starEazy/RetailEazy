'use strict'

const {
  successResponse,
  internalServerErrorResponse,
  errorResponse,
} = require('../apps/helpers/customResponseTemplate')
const { writeLog } = require('../apps/helpers/utils')
const CommonService = require('../services/CommonService')

class CommonController extends CommonService {
  constructor() {
    super()
  }

  static async Sync_UserApiLogDetail(value) {
    try {
      const result = super.Sync_UserApiLogDetail(value)
      return successResponse(req, res, 'Success', result)
    } catch (ex) {
      writeLog(
        `
        ${req.url},
        'UserApiLogDetail',
        'UserApiLogDetail',
        ${ex},`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'An unexpected error occurred. We are working on it.',
        ex.message,
      )
    }
  }
  static async Sync_AppAutomaticErrorLog(value) {
    try {
      const result = super.Sync_AppAutomaticErrorLog(value)
      return successResponse(req, res, 'Success', result)
    } catch (ex) {
      const objAuth = new Auth() // Assuming Auth class is defined and available
      writeLog(
        `
        ${req.url},
        'AppAutomaticErrorLog',
        'Sync_AppAutomaticErrorLog',
        ${ex},`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'An unexpected error occurred. We are working on it.',
        ex.message,
      )
    }
  }
  static async Sync_AppErrorLog(value) {
    try {
      const result = super.Sync_ManualErrorLogs(value)
      return successResponse(req, res, 'Success', result)
    } catch (ex) {
      const objAuth = new Auth() // Assuming Auth class is defined and available
      writeLog(
        `
        ${req.url},
        'manualerrorlogsync',
        'Sync_manualerrorlogsync',
        ${ex},`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'An unexpected error occurred. We are working on it.',
        ex.message,
      )
    }
  }

  static async postHandler(req, res) {
    try {
      const JsonString = req.body
      const tokenDetails = req.user

      const result = super.Chart(JsonString, tokenDetails)

      if (result && result.length > 0) {
        return successResponse(res, res, `Success`)
      } else {
        return errorResponse(req, res, 'Something went wrong')
      }
    } catch (exdb) {
      writeLog(`${req.url}, 'Dashboards', 'POST', ${exdb}`, 'error')
      return internalServerErrorResponse(
        req,
        res,
        'Unexpected error occurred. We are working on it.',
        exdb.message,
      )
    }
  }
}

module.exports = CommonController
