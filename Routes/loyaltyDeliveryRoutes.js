"use strict";

const express = require("express");
const jwt_auth = require("../apps/JWT/jwt_auth");
const LoyaltyController = require("../controllers/loyaltyController");

const router = express.Router();


router.post(
  "/GetBrandCatalogue_master",
  jwt_auth.authenticate,
  LoyaltyController.GetBrandCatalogue
);

module.exports = router;
