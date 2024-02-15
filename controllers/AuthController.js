'use strict'

const joiSchema = require('../apps/ValidateBody/schema')
const {
  commonApiResponse,
  errorResponse,
  successResponse,
  internalServerErrorResponse,
} = require('../apps/helpers/customResponseTemplate')
const AuthService = require('../services/AuthService')
const { writeLog } = require('../apps/helpers/utils')
const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
}

class AuthController extends AuthService {
  constructor() {
    super()
  }
  static async CustomerAuth(req, res) {
    try {
      const { error } = joiSchema.CustomerAuthSchema.validate(
        req.body,
        joiOptions,
      )
      if (error) {
        return errorResponse(
          req,
          res,
          'fields missing or invalid',
          error.message,
        )
      } else {
        // Write logs
        let result = await super.customerAuth(req.body, req.body.dms_token)

        if (result != null || result != undefined) {
          res.setHeader('Token', result.login_token)
          return successResponse(
            req,
            res,
            'User logged-in successfully',
            result,
          )
        } else {
          return errorResponse(req, res, 'Username or Password is incorrect.')
        }
      }
    } catch (e) {
      return commonApiResponse(req, res, false, e.toString())
    }
  }

  static async APP_UserLogOut(req, res) {
    try {
      const objval = req.body

      const { error } = joiSchema.logoutSchema.validate(req.body, joiOptions)
      if (error) {
        return errorResponse(
          req,
          res,
          'fields missing or invalid',
          error.message,
        )
      } else {
        let result = await super.APP_UserLogOut(objval)

        if (result != null || result != undefined) {
          return successResponse(req, res, 'success', result)
        } else {
          return errorResponse(
            req,
            res,
            'UnExcepted has occured.We are working on it.',
          )
        }
      }
    } catch (e) {
      console.log(e)
      return errorResponse(
        req,
        res,
        'UnExcepted has occured.We are working on it.',
        e,
      )
    }
  }

  static async appAuth(req, res) {
    try {
      const { value } = req.body

      if (!value) {
        return errorResponse(req, res, `Invalid Client!`)
      }

      const response = await super.IsDownLoadApp(value)

      if (response && response.status === true) {
        return successResponse(req, res, 'Client Found Successfully.', response)
      } else {
        return errorResponse(req, res, `Invalid Client!`)
      }
    } catch (error) {
      writeLog(`${req.url} ,Authenticate, AppAuth ,${error}`, 'error')
      return internalServerErrorResponse(
        req,
        res,
        'Something went wrong.',
        error.message,
      )
    }
  }

  static async UpdateProfile(req, res) {
    try {
      const { model } = req.body
      const { user_id } = req.user
      const result = await super.updateProfile(model, user_id)

      if (result.GetStaus) {
        return successResponse(req, res, result.GetMessage)
      } else {
        return errorResponse(req, res, result.GetMessage)
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Authenticate",
        "update profile",
        ${error}`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'Unexpected error occurred. We are working on it.',
        error.message,
      )
    }
  }

  static async changePassword(req, res) {
    try {
      const { model } = req.body
      const { user_id } = req.user
      const result = await super.changePasswordRequest(model, user_id)

      if (result.GetStaus) {
        return successResponse(req, res, result.GetMessage)
      } else {
        return errorResponse(req, res, result.GetMessage)
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Authenticate",
        "ChangePassword",
        ${error}`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'Unexpected error occurred. We are working on it.',
        error.message,
      )
    }
  }
  static async UpdateKYC(req, res) {
    try {
      const { objupdatekyc } = req.body
      const { user_id } = req.user
      const result = await super.UpdateKYC(objupdatekyc, user_id)

      if (result.GetStaus) {
        return successResponse(req, res, result.GetMessage)
      } else {
        return errorResponse(req, res, result.GetMessage)
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Authenticate",
        "UpdateKYC",
        ${error}`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'Unexpected error occurred. We are working on it.',
        error.message,
      )
    }
  }

  static async GlobalSetting(req, res) {
    try {
      const { type } = req.params || 'R' // Default value is 'R'

      // R=ReadOnly
      // W=WriteOnly

      const result = await super.getGlobalSetting(type)

      return successResponse(req, res, `Success`, result)
    } catch (error) {
      writeLog(
        `${req.url},
        "Get Global Setting",
        "GlobalSetting",
        ${error}`,
        'error',
      )
      return internalServerErrorResponse(
        req,
        res,
        'Unexpected error occurred. We are working on it.',
        error.message,
      )
    }
  }
}

module.exports = AuthController
