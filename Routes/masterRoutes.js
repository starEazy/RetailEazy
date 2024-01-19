"use strict";

const express = require("express");
const MasterController = require("../controllers/MasterController");
const DMSMasterController = require("../controllers/DMSMasterController");
const jwt_auth = require("../apps/JWT/jwt_auth");

const router = express.Router();

router.post("/GetBrand", jwt_auth.authenticate, MasterController.GetBrand);
router.post(
  "/Distributor",
  jwt_auth.authenticate,
  MasterController.Distributor
);
router.post("/GetDealer", jwt_auth.authenticate, MasterController.GetDealer);
router.post("/Item", jwt_auth.authenticate, MasterController.Item);
router.post(
  "/ITEMGROUPMASTER",
  jwt_auth.authenticate,
  MasterController.ITEMGROUPMASTER
);
router.post("/Unit", jwt_auth.authenticate, MasterController.Unit);
router.post("/Division", jwt_auth.authenticate, MasterController.Division);
router.post(
  "/UserDivisionMapping",
  jwt_auth.authenticate,
  MasterController.UserDivisionMapping
);
router.post("/GetCity", jwt_auth.authenticate, MasterController.GetCity);
router.post("/GetState", jwt_auth.authenticate, MasterController.GetState);
router.post("/GetCountry", jwt_auth.authenticate, MasterController.GetCountry);
router.post(
  "/GetDesignation",
  jwt_auth.authenticate,
  MasterController.GetDesignation
);
router.post(
  "/DistributorDivisionTagging",
  jwt_auth.authenticate,
  MasterController.DistributorDivisionTagging
);
router.post(
  "/PrimaryCategory",
  jwt_auth.authenticate,
  MasterController.PrimaryCategory
);
router.post(
  "/SecondaryCategory",
  jwt_auth.authenticate,
  MasterController.SecondaryCategory
);
router.post(
  "/DSDLRCONTACTDETAIL",
  jwt_auth.authenticate,
  MasterController.DSDLRCONTACTDETAIL
);
router.post(
  "/NotificationData",
  jwt_auth.authenticate,
  MasterController.NotificationData
);
router.post(
  "/GetHsnMaster",
  jwt_auth.authenticate,
  MasterController.GetHsnMaster
);
router.post(
  "/DSDLRCONTACTDETAIL",
  jwt_auth.authenticate,
  MasterController.DSDLRCONTACTDETAIL
);
router.post(
  "/AdvertisementData",
  jwt_auth.authenticate,
  MasterController.AdvertisementData
);
router.post("/LoginType", jwt_auth.authenticate, MasterController.LoginType);
router.post(
  "/SaveCustomerMaster",
  jwt_auth.authenticate,
  MasterController.SaveCustomerMaster
);
router.post(
  "/DmsSyncStatus",
  jwt_auth.authenticate,
  MasterController.dmsSyncStatus
);
router.post(
  "/DMSGetPurchaseInvoice",
  jwt_auth.checkDmsToken,
  // jwt_auth.authenticate,
  MasterController.DMSGetPurchaseInvoice
);
router.post(
  "/DMSGetOrder",
  jwt_auth.authenticate,
  DMSMasterController.DMSGetOrder
);
router.post(
  "/DMSGetDistributorOrder",
  jwt_auth.authenticate,
  DMSMasterController.DMSGetDistributorOrder
);

module.exports = router;
