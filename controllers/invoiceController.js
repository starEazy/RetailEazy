"use strict";

const { successResponse, errorResponse } = require("../apps/helpers/customResponseTemplate");
const InvoiceService = require("../services/invoiceService");
const joiSchema = require("../apps/ValidateBody/schema");

class InvoiceController extends InvoiceService {
  constructor() {
    super();
  }
  static async GetBillingDetail(req, res){
    try {
      let objvalue = req.body;
      const { error } = joiSchema.purchaseInvoiceSchema.validate(objvalue, joiOptions);
      if (error) {
        return errorResponse(
          req,
          res,
          "fields missing or invalid",
          error.message
        );
      } else {
        let ObjResult = await super.GetOrderJson(objvalue,"PURCHASEINVOICE");
        if (ObjResult != ""){
          return successResponse(req, res, "success", result);
        }
        else{
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
}

module.exports = InvoiceController;
