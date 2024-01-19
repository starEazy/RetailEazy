"use strict";

const express = require("express");
const router = express.Router();
const jwt_auth = require("../apps/JWT/jwt_auth");
const InvoiceController = require("../controllers/invoiceController");

router.post("/GetDetail", jwt_auth.authenticate, InvoiceController.GetBillingDetail);

module.exports = router;
