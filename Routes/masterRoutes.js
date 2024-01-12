"use strict";

const express = require("express");
const MasterController = require("../controllers/MasterController");
const jwt_auth = require("../apps/JWT/jwt_auth");

const router = express.Router();

router.post("/GetBrand", jwt_auth.authenticate, MasterController.GetBrand);
router.post(
  "/Distributor",
  jwt_auth.authenticate,
  MasterController.Distributor
);

module.exports = router;
