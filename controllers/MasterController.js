"use strict";

const MasterService = require("../services/MasterService");

const joiSchema = require("../apps/ValidateBody/schema");
const {
  errorResponse,
  successResponse,
} = require("../apps/helpers/customResponseTemplate");
const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
};

const MasterType = {
  DEALER: 1,
  DISTRIBUTOR: 2,
  SALESPERSON: 3,
  ITEM: 4,
  UNIT: 6,
  ITEMSTANDARDRATEMASTER: 7,
  ORDERLIST: 8,
  ORDERBYID: 9,
  ORDERITEM: 10,
  ITEMGROUPMASTER: 11,
  BRAND: "BRAND",
  CITY: 13,
  STATE: 14,
  DIVISION: 15,
  USERDIVISION: 16,
  PLACEDORDER: 17,
  RECEIVEDORDER: 18,
  DESIGNATION: 19,
  BILLING: 20,
  DISTRIBUTORDIVISIONTAGGING: 21,
  PRIMARYCATEGORY: 22,
  SECONDARYCATEGORY: 23,
  PURCHASEINVOICE: 24,
  DSDLRCONTACTDETAIL: 25,
  SALESINVOICE: 26,
  GETSTOCKDETAIL: 27,
  HSNMASTER: 28,
  ADVERTISEMENTDATA: 29,
  NOTIFICATIONDATA: 30,
  COUNTRY: 31,
  GETPURCHASE: 32,
  GETORDER: 33,
  LOGINTYPE: 34,
  VENDOR: 35,
  REDEMPTIONTYPE: 36,
  CATALOGUE: 37,
  BRAND_CATALOGUE: 38,
  BRAND_CATALOGUE_MASTER: 40,
  DELIVERY: 41,
  LOYALTYTRANSACTION: 42,
  GIFTVOUCHER: 43,
  GETDMSDISTRIBUTORORDER: 44,
};

class MasterController extends MasterService {
  constructor() {
    super();
  }

  static async GetBrand(req, res) {
    try {
      const objval = req.body;
      const { user_id } = req.user;

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
        let result = await super.MasterData(objval, MasterType.BRAND, user_id);

        if (result != null || result != undefined) {
          return successResponse(req, res, "success", result);
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
  static async Distributor(req, res) {
    try {
      const objval = req.body;
      const { user_id } = req.user;

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
        let result = await super.MasterData(objval, "DISTRIBUTOR", user_id);

        if (result != null || result != undefined) {
          return successResponse(req, res, "success", result);
        } else {
          return errorResponse(req, res, "No record found.");
        }
      }
    } catch (e) {
      return errorResponse(
        req,
        res,
        "UnExcepted has occured.We are working on it.",
        e.toString()
      );
    }
  }
}

module.exports = MasterController;
