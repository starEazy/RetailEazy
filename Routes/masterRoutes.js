"use strict";

const express = require("express");
const MasterController = require("../controllers/MasterController");
const DMSMasterController = require("../controllers/DMSMasterController");
const jwt_auth = require("../apps/JWT/jwt_auth");

const router = express.Router();

router.post("/GetBrand_nv1", jwt_auth.authenticate, MasterController.GetBrand);
router.post(
  "/Distributor_nv1",
  jwt_auth.authenticate,
  MasterController.Distributor
);
router.post("/GetDealer_nv1", jwt_auth.authenticate, MasterController.GetDealer);
router.post("/Item_nv1", jwt_auth.authenticate, MasterController.Item);
router.post(
  "/ITEMGROUPMASTER_nv1",
  jwt_auth.authenticate,
  MasterController.ITEMGROUPMASTER
);
router.post("/Unit_nv1", jwt_auth.authenticate, MasterController.Unit);
router.post("/Division_nv1", jwt_auth.authenticate, MasterController.Division);
router.post(
  "/UserDivisionMapping_nv1",
  jwt_auth.authenticate,
  MasterController.UserDivisionMapping
);
router.post("/GetCity_nv1", jwt_auth.authenticate, MasterController.GetCity);
router.post("/GetState_nv1", jwt_auth.authenticate, MasterController.GetState);
router.post("/GetCountry_nv1", jwt_auth.authenticate, MasterController.GetCountry);
router.post(
  "/GetDesignation_nv1",
  jwt_auth.authenticate,
  MasterController.GetDesignation
);
router.post(
  "/DistributorDivisionTagging_nv1",
  jwt_auth.authenticate,
  MasterController.DistributorDivisionTagging
);
router.post(
  "/PrimaryCategory_nv1",
  jwt_auth.authenticate,
  MasterController.PrimaryCategory
);
router.post(
  "/SecondaryCategory_nv1",
  jwt_auth.authenticate,
  MasterController.SecondaryCategory
);
router.post(
  "/DSDLRCONTACTDETAIL_nv1",
  jwt_auth.authenticate,
  MasterController.DSDLRCONTACTDETAIL
);
router.post(
  "/NotificationData_nv1",
  jwt_auth.authenticate,
  MasterController.NotificationData
);
router.post(
  "/GetHsnMaster_nv1",
  jwt_auth.authenticate,
  MasterController.GetHsnMaster
);
router.post(
  "/DSDLRCONTACTDETAIL_nv1",
  jwt_auth.authenticate,
  MasterController.DSDLRCONTACTDETAIL
);
router.post(
  "/AdvertisementData_nv1",
  jwt_auth.authenticate,
  MasterController.AdvertisementData
);
router.post("/LoginType_nv1", jwt_auth.authenticate, MasterController.LoginType);
router.post(
  "/SaveCustomerMaster_nv1",
  jwt_auth.authenticate,
  MasterController.SaveCustomerMaster
);
router.post(
  "/DmsSyncStatus_nv1",
  jwt_auth.authenticate,
  MasterController.dmsSyncStatus
);
router.post(
  "/DMSGetPurchaseInvoice_nv1",
  jwt_auth.checkDmsToken,
  // jwt_auth.authenticate,
  MasterController.DMSGetPurchaseInvoice
);
router.post(
  "/DMSGetOrder_nv1",
  jwt_auth.checkDmsToken,
  jwt_auth.authenticate,
  DMSMasterController.DMSGetOrder
);
router.post(
  "/DMSGetDistributorOrder_nv1",
  jwt_auth.checkDmsToken,
  jwt_auth.authenticate,
  DMSMasterController.DMSGetDistributorOrder
);

module.exports = router;
