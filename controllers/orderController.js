"use strict";

const InvoiceService = require("../services/invoiceService");
const OrderService = require("../services/orderService");

const {
  successResponse,
  errorResponse,
} = require("../apps/helpers/customResponseTemplate");
const joiSchema = require("../apps/ValidateBody/schema");

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
};
