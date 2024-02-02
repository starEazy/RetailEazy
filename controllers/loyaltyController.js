"use strict";

const {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
} = require("../apps/helpers/customResponseTemplate");
const { writeLog } = require("../apps/helpers/utils");
const LoyaltyService = require("../services/LoyaltyService");

class LoyaltyController extends LoyaltyService {
  constructor() {
    super();
  }

  static async Getredemptiontype(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Loyalty_MasterData(
        objvalue,
        "REDEMPTIONTYPE",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Loyalty_Master",
        "Getredemptiontype",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
  static async GetVendor(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Loyalty_MasterData(
        objvalue,
        "VENDOR",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Loyalty_Master",
        "VENDOR",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
  static async GetCatalogue(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Loyalty_MasterData(
        objvalue,
        "CATALOGUE",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Loyalty_Master",
        "CATALOGUE",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
  static async GetDelivery(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Loyalty_MasterData(
        objvalue,
        "DELIVERY",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Loyalty_Master",
        "GET_DELIVERY",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
  static async GetBrandCatalogue(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Loyalty_MasterData(
        objvalue,
        "BRAND_CATALOGUE",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Loyalty_Master",
        "GET_BRAND_CATALOGUE",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
  static async GetBrandCatalogue_master(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Get_transaction_voucher_Json(
        objvalue,
        "LOYALTYTRANSACTION",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "TransactionGetDetail",
        "POST",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
  static async GetTransactionDetail(req, res) {
    try {
      const { user_id } = req.user;
      const objvalue = req.body;

      const result = await super.Loyalty_MasterData(
        objvalue,
        "BRAND_CATALOGUE_MASTER",
        user_id
      );

      if (result && result !== "null") {
        return successResponse(req, res, `success`, result);
      } else {
        return errorResponse(req, res, `No record found.`);
      }
    } catch (error) {
      writeLog(
        `${req.url},
        "Loyalty_Master",
        "GetBrandCatalogue_master",
        ${error}`,
        "error"
      );
      return internalServerErrorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        error.message
      );
    }
  }
}

module.exports = LoyaltyController;
