"use strict";

const InvoiceService = require("../services/invoiceService");
const EmailService = require("../services/EmailServices");

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

module.exports = class EmailController extends EmailService {
  constructor() {
    super();
  }

  static async POST(req,res){
    try {
        console.log(req.body);
        let model = req.body;
        writeLog(`api/Email/OTP Inputs ${model}`);
        let result = await super.EmailRequest(model);
        console.log(result,'....result');
        // if (result.GetStaus)
        // {                  
        //     return Ok(Response.Success(result.GetMessage));
        // }
        // else
        //     return Ok(Response.Error(result.GetMessage));
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