"use strict";

const { error } = require("winston");
const {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
} = require("../apps/helpers/customResponseTemplate");
const InvoiceService = require("../services/invoiceService");
const joiSchema = require("../apps/ValidateBody/schema");
const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
};

class InvoiceController extends InvoiceService {
  constructor() {
    super();
  }

  static async SavePurchaseInvoice(req, res) {
    try {
      let objPIDetails = null;
      let attachments = [];
      let IsError = false;

      // Parse form fields
      if (req.body) {
        if (req.body.purchasedetails) {
          objPIDetails = JSON.parse(req.body.purchasedetails);
        }
        // Other fields like FileBase64String, FileName can be processed similarly
      }

      // Handle file uploads
      if (req.files) {
        req.files.forEach((file) => {
          // Process file...
          let attachment = {
            content: file.buffer, // or use file.path if you're saving the file
            filename: file.originalname,
            fileaddress: "/Image/PurchaseInvoiceDocument/",
          };
          attachments.push(attachment);
          if (objPIDetails) {
            objPIDetails.PIAttachment.push(attachment);
          }
        });
      }

      // Process and save invoice details (mock function)
      let result = super.saveInvoiceDetails(objPIDetails, attachments, IsError);

      if (IsError) {
        return errorResponse(req, res, "error", result);
      } else {
        if (result) {
          return successResponse(req, res, "Success", result);
        } else {
          return errorResponse(req, res, "error", "No record found");
        }
      }
    } catch (ex) {
      // Error handling
      console.error(ex);
      return internalServerErrorResponse(
        req,
        res,
        "An unexpected error occurred."
      );
    }
  }
  static async GetBillingDetail(req, res){
    try {
      let objvalue = req.body;
      const { user_id } = req.user;
      const { error } = joiSchema.purchaseInvoiceSchema.validate(objvalue, joiOptions);
      if (error) {
        return errorResponse(
          req,
          res,
          "fields missing or invalid",
          error.message
        );
      } else {
        let ObjResult = await super.GetOrderJson(objvalue,user_id,"PURCHASEINVOICE");
        if (ObjResult != ""){
          return successResponse(req, res, "success", ObjResult);
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
      )
    }
  }
}

module.exports = InvoiceController;
