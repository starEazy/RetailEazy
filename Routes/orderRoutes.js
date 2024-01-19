"use strict";

const express = require("express");
const router = express.Router();
const jwt_auth = require("../apps/JWT/jwt_auth");
const OrderController = require("../controllers/orderController");

router.post(
  "/GetBillingDetail",
  jwt_auth.authenticate,
  OrderController.GetBillingDetail
);
router.post(
  "/GetReceivedOrder",
  jwt_auth.authenticate,
  OrderController.GetReceivedOrder
);
router.post(
  "/GetPlacedOrder",
  jwt_auth.authenticate,
  OrderController.GetPlacedOrder
);

module.exports = router;
