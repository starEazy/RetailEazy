"use strict"

const joiSchema = require("../apps/ValidateBody/schema");
const {
  errorResponse,
  successResponse,
} = require("../apps/helpers/customResponseTemplate");
const { writeLog } = require("../apps/helpers/utils");
const DMSMasterService = require("../services/DMSMasterServices");
const joiOptions = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true, // remove unknown props
};

class DMSMasterController extends DMSMasterService {
    constructor() {
        super();
    }

    static async DMSGetOrder(req,res){
        let IsError = false;
        try {
            const objval = req.body;

            const { error } = joiSchema.dmsMasterSchema.validate(req.body, joiOptions);
            if (error) {
                return errorResponse(
                req,
                res,
                "fields missing or invalid",
                error.message
                );
            } else {
                const result = await super.GetPIOrderFromDms(objval, "GETORDER");
                console.log(result,'....result');

                if(IsError == true){
                    return errorResponse(req, res, "", result);
                }else{
                    if(result != ""){
                        return successResponse(req, res, "success", result);
                    }else if(result == ""){
                        return errorResponse(req, res, "Data not found", result);
                    }else{
                        return errorResponse(req, res, "Something went wrong.", result);
                    }
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

    static async DMSGetDistributorOrder(req,res){
        let IsError = false;
        try {
            const objval = req.body;

            const { error } = joiSchema.dmsMasterSchema.validate(req.body, joiOptions);
            if (error) {
                return errorResponse(
                req,
                res,
                "fields missing or invalid",
                error.message
                );
            } else {
                writeLog(`${objval.ToString()} + "Start api/Master/DMSGetDistributorOrder "`);
                let result = await GetDistributorOrderFromDms(objval,"GETDMSDISTRIBUTORORDER")
                if (IsError == true)
                {
                    return errorResponse(req, res, "", result);
                }
                else
                {
                    if (!string.IsNullOrEmpty(result))
                    {
                        return successResponse(req, res, "success", result);
                    }
                    else if (string.IsNullOrEmpty(result))
                    {
                        return errorResponse(req, res, "Data not found", result);
                    }
                    else
                    {
                        return errorResponse(req, res, "Something went wrong.", result);
                    }
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

module.exports = DMSMasterController;