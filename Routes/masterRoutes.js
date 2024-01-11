"use strict";

const express = require("express");
const MasterController = require("../controllers/MasterController");

const router = express.Router();

router.post("/GetBrand", MasterController.GetBrand);

module.exports = router;
