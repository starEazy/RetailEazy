"use strict";

const MasterService = require("../services/MasterService");

const joiSchema = require("../apps/ValidateBody/schema");
const { errorResponse, successResponse } = require("../apps/helpers/customResponseTemplate");
const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
};

class MasterController extends MasterService {
  constructor() {
    super();
  }


  static async GetBrand(req, res) {
    try {
      const objval = req.body;

      console.log(objval);
      const { error } = joiSchema.getBrandSchema.validate(req.body, joiOptions);
      if (error) {
        return errorResponse(
          req,
          res,
          "fields missing or invalid",
          error.message
        );
      } else {
        let result = await super.MasterData(objval, 12);

        if (result != null || result != undefined) {
          return successResponse(req, res, "success", result);
        } else {
          return errorResponse(req, res, "No record found.");
        }
      }
    } catch (e) {
      return errorResponse(req, res, e.toString());
    }
  }
}

module.exports = MasterController;
