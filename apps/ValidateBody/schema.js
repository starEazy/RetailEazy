const Joi = require("joi");
const nameRegx = /^([a-zA-Z]+\s)*[a-zA-Z]+$/;
const numberRegx = /^[0-9][0-9\s]*$/;
const postal_regex = /^[1-9][0-9]{5}$/;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,20}$/;

const alphanumericCharacters = /^\s*([0-9a-zA-Z ]*)\s*$/;
const numberPatern = /^(^62|^08)(\d{3,4}-?){2}\d{3,4}$/;
const schemas = {
  CustomerAuthSchema: Joi.object().keys({
    Username: Joi.string().required(),
    Password: Joi.string().required(),
    FcmDeviceid: Joi.string().required(),
    IPINNumber: Joi.number().allow(null).optional(),
    imei_no: Joi.string().allow(null).allow("").optional(),
    Devicetype: Joi.number().required(),
    ClientID: Joi.string().allow(null).allow("").optional(),
    DeviceInfo: Joi.string().required(),
    VersionCode: Joi.number().required(),
    VersionName: Joi.string().required(),
    EazyErpAppVersion: Joi.string().allow(null).allow("").optional(),
    TallyExpiry_date: Joi.string().allow(null).allow("").optional(),
    IsOTPLogin: Joi.boolean().required(),
    OTPLoginPassword: Joi.string().allow(null).allow("").optional(),
    loginappname: Joi.string().allow(null).allow("").optional(),
  }),
  masterSchema: Joi.object().keys({
    alteredon: Joi.string().required(),
    pageindexno: Joi.number().required(),
    processtype: Joi.string().required(),
  }),
  logoutSchema: Joi.object().keys({
    LedgerCode: Joi.string().required(),
    MobileNo: Joi.string().required(),
    BrandCode: Joi.string().required(),
    Remarks: Joi.string().required(),
  }),
  syncStatusSchema: Joi.object().keys({
    ModelName: Joi.string().required(),
    MasterIds: Joi.string().required(),
  }),

  saveCustomerSchema: Joi.object().keys({
    row_id: Joi.number().required(),
    brand_id: Joi.number().required(),
    customer_name: Joi.string().required(),
    address: Joi.string().required(),
    pincode: Joi.string().required(),
    email_id: Joi.string().required(),
    gstin_no: Joi.string().allow("").optional(),
    city_id: Joi.number().required(),
    state_id: Joi.number().required(),
    country_id: Joi.number().required(),
    contact_no: Joi.string().allow("").optional(),
    pan_no: Joi.string().required(),
    upi_id: Joi.string().allow("").optional(),
    paytm_mob_no: Joi.string().required(),
    designation_id: Joi.number().required(),
    margin: Joi.number().required(),
    Devicetype: Joi.number().required(),
  }),
};

module.exports = schemas;
