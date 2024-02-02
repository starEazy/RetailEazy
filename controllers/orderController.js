"use strict";

const InvoiceService = require("../services/invoiceService");
const OrderService = require("../services/orderService");

const {
  successResponse,
  errorResponse,
} = require("../apps/helpers/customResponseTemplate");
const joiSchema = require("../apps/ValidateBody/schema");
const { writeLog } = require("../apps/helpers/utils");

const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
};

module.exports = class OrderController extends OrderService {
  constructor() {
    super();
  }

  static async GetBillingDetail(req, res) {
    try {
      let objvalue = req.body;
      const { user_id } = req.user;
      const { error } = joiSchema.purchaseInvoiceSchema.validate(
        objvalue,
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
        let ObjResult = await InvoiceService.GetOrderJson(
          objvalue,
          user_id,
          "BILLING"
        );
        if (ObjResult != "") {
          return successResponse(req, res, "success", ObjResult);
        } else {
          return errorResponse(req, res, "No record found.");
        }
      }
    } catch (e) {
      return errorResponse(
        req,
        res,
        "Unexpected error occured , We are working on it",
        e.toString()
      );
    }
  }
  static async GetReceivedOrder(req, res) {
    try {
      let objvalue = req.body;
      const { user_id } = req.user;
      const { error } = joiSchema.purchaseInvoiceSchema.validate(
        objvalue,
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
        let ObjResult = await InvoiceService.GetOrderJson(
          objvalue,
          user_id,
          "RECEIVEDORDER"
        );
        if (ObjResult != "") {
          return successResponse(req, res, "success", ObjResult);
        } else {
          return errorResponse(req, res, "No record found.");
        }
      }
    } catch (e) {
      return errorResponse(
        req,
        res,
        "Unexpected error occured , We are working on it",
        e.toString()
      );
    }
  }
  static async GetPlacedOrder(req, res) {
    try {
      let objvalue = req.body;
      const { user_id } = req.user;
      const { error } = joiSchema.purchaseInvoiceSchema.validate(
        objvalue,
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
        let ObjResult = await InvoiceService.GetOrderJson(
          objvalue,
          user_id,
          "PURCHASEINVOICE"
        );
        if (ObjResult != "") {
          return successResponse(req, res, "success", ObjResult);
        } else {
          return errorResponse(req, res, "No record found.");
        }
      }
    } catch (e) {
      return errorResponse(
        req,
        res,
        "Unexpected error occured , We are working on it",
        e.toString()
      );
    }
  }

  static async itemStock(req, res) {
    try {
      const { user_id } = req.user;
      const ObjResult = await super.ItemStockPost(req.body, user_id);

      if (ObjResult.status) {
        return successResponse(req, res, ObjResult.message);
      } else {
        return errorResponse(req, res, ObjResult.message);
      }
    } catch (ex) {
      writeLog(`${req.url} ItemStock  POST`);

      return errorResponse(
        req,
        res,
        "Unexpected error occurred. We are working on it.",
        ex.message
      );
    }
  }
};
