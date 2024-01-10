"use strict";

const joiSchema = require("../apps/ValidateBody/schema");
const {
  commonApiResponse,
  errorResponse,
  successResponse,
} = require("../apps/helpers/customResponseTemplate");
const AuthService = require("../services/AuthService");
const loggerInstance = require("../apps/loaders/logger");
const { writeLog } = require("../apps/helpers/utils");
const postgreConnection = require("../apps/helpers/sequelizeHelper");
const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
};

class AuthController extends AuthService {
  constructor() {
    super();
  }
  static async CustomerAuth(req, res) {
    try {
      const {
        Username,
        Password,
        FcmDeviceid,
        IPINNumber,
        imei_no,
        Devicetype,
        ClientID,
        DeviceInfo,
        VersionCode,
        VersionName,
        EazyErpAppVersion,
        TallyExpiry_date,
        IsOTPLogin,
        OTPLoginPassword,
        loginappname,
      } = req.body;

      const userCredential = {
        Username,
        Password,
        FcmDeviceid,
        IPINNumber,
        imei_no,
        Devicetype,
        ClientID,
        DeviceInfo,
        VersionCode,
        VersionName,
        EazyErpAppVersion,
        TallyExpiry_date,
        IsOTPLogin,
        OTPLoginPassword,
        loginappname,
      };

      const { error } = joiSchema.CustomerAuthSchema.validate(
        req.body,
        joiOptions
      );
      if (error) {
        return errorResponse(
          req,
          res,
          "fields missing or invalid",
          error.message
        );
      } else {
        // Write logs
        let result = await super.customerAuth(userCredential);

        console.log(">>>>>>>>>>>>>>>>", result);
        if (result != null || result != undefined) {
          res.setHeader("Token", "star");
          return successResponse(
            req,
            res,
            "User logged-in successfully",
            result
          );
        } else {
          return errorResponse(req, res, "Username or Password is incorrect.");
        }
      }
    } catch (e) {
      return commonApiResponse(req, res, false, e.toString());
    }
  }
}

module.exports = AuthController;